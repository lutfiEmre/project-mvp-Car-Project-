import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as xml2js from 'xml2js';

interface ImportedVehicle {
  title?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  vin?: string;
  stockNumber?: string;
  mileage: number;
  price: number;
  description?: string;
  exteriorColor?: string;
  interiorColor?: string;
  fuelType?: string;
  transmission?: string;
  driveType?: string;
  bodyType?: string;
  images?: string[];
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  async importFromJson(dealerId: string, userId: string, jsonData: ImportedVehicle[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const vehicle of jsonData) {
      try {
        await this.createListingFromImport(dealerId, userId, vehicle);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import ${vehicle.make} ${vehicle.model}: ${error.message}`);
      }
    }

    return results;
  }

  async importFromXml(dealerId: string, userId: string, xmlString: string) {
    const parser = new xml2js.Parser({ explicitArray: false });
    
    try {
      const result = await parser.parseStringPromise(xmlString);
      const vehicles = this.parseXmlVehicles(result);
      return this.importFromJson(dealerId, userId, vehicles);
    } catch (error) {
      throw new BadRequestException('Invalid XML format');
    }
  }

  private parseXmlVehicles(xmlResult: any): ImportedVehicle[] {
    // Handle common XML structures
    const vehiclesArray = 
      xmlResult.vehicles?.vehicle ||
      xmlResult.inventory?.vehicle ||
      xmlResult.listings?.listing ||
      [];

    const vehicles = Array.isArray(vehiclesArray) ? vehiclesArray : [vehiclesArray];

    return vehicles.map((v: any) => ({
      title: v.title,
      make: v.make,
      model: v.model,
      year: parseInt(v.year),
      trim: v.trim,
      vin: v.vin,
      stockNumber: v.stockNumber || v.stock_number,
      mileage: parseInt(v.mileage || v.odometer || '0'),
      price: parseFloat(v.price || v.asking_price || '0'),
      description: v.description || v.comments,
      exteriorColor: v.exteriorColor || v.exterior_color,
      interiorColor: v.interiorColor || v.interior_color,
      fuelType: v.fuelType || v.fuel_type,
      transmission: v.transmission,
      driveType: v.driveType || v.drive_type,
      bodyType: v.bodyType || v.body_type,
      images: this.parseImages(v.images || v.photos),
    }));
  }

  private parseImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') return [images];
    if (images.image) return Array.isArray(images.image) ? images.image : [images.image];
    if (images.photo) return Array.isArray(images.photo) ? images.photo : [images.photo];
    return [];
  }

  private async createListingFromImport(dealerId: string, userId: string, vehicle: ImportedVehicle) {
    const slug = this.generateSlug(vehicle);

    return this.prisma.listing.create({
      data: {
        userId,
        dealerId,
        title: vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        slug,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        trim: vehicle.trim,
        vin: vehicle.vin,
        stockNumber: vehicle.stockNumber,
        mileage: vehicle.mileage,
        price: vehicle.price,
        description: vehicle.description,
        exteriorColor: vehicle.exteriorColor,
        interiorColor: vehicle.interiorColor,
        fuelType: this.mapFuelType(vehicle.fuelType),
        transmission: this.mapTransmission(vehicle.transmission),
        driveType: this.mapDriveType(vehicle.driveType),
        bodyType: this.mapBodyType(vehicle.bodyType),
        status: 'DRAFT',
      },
    });
  }

  private generateSlug(vehicle: ImportedVehicle): string {
    const base = `${vehicle.year}-${vehicle.make}-${vehicle.model}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const unique = Date.now().toString(36);
    return `${base}-${unique}`;
  }

  private mapFuelType(type?: string): any {
    const map: Record<string, string> = {
      gas: 'GASOLINE',
      gasoline: 'GASOLINE',
      petrol: 'GASOLINE',
      diesel: 'DIESEL',
      electric: 'ELECTRIC',
      ev: 'ELECTRIC',
      hybrid: 'HYBRID',
      'plug-in hybrid': 'PLUG_IN_HYBRID',
      phev: 'PLUG_IN_HYBRID',
      hydrogen: 'HYDROGEN',
    };
    return map[type?.toLowerCase() || ''] || 'GASOLINE';
  }

  private mapTransmission(type?: string): any {
    const map: Record<string, string> = {
      automatic: 'AUTOMATIC',
      auto: 'AUTOMATIC',
      manual: 'MANUAL',
      stick: 'MANUAL',
      cvt: 'CVT',
      dct: 'DCT',
    };
    return map[type?.toLowerCase() || ''] || 'AUTOMATIC';
  }

  private mapDriveType(type?: string): any {
    const map: Record<string, string> = {
      fwd: 'FWD',
      'front-wheel': 'FWD',
      rwd: 'RWD',
      'rear-wheel': 'RWD',
      awd: 'AWD',
      'all-wheel': 'AWD',
      '4wd': 'FOUR_WD',
      '4x4': 'FOUR_WD',
    };
    return map[type?.toLowerCase() || ''] || 'FWD';
  }

  private mapBodyType(type?: string): any {
    const map: Record<string, string> = {
      sedan: 'SEDAN',
      suv: 'SUV',
      coupe: 'COUPE',
      convertible: 'CONVERTIBLE',
      hatchback: 'HATCHBACK',
      wagon: 'WAGON',
      pickup: 'PICKUP',
      truck: 'PICKUP',
      van: 'VAN',
      minivan: 'MINIVAN',
      crossover: 'CROSSOVER',
    };
    return map[type?.toLowerCase() || ''] || 'OTHER';
  }
}

