import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehicleDataService {
  constructor(private prisma: PrismaService) {}

  async getAllMakes(popular?: boolean) {
    const where: any = {};
    if (popular !== undefined) where.isPopular = popular;

    return this.prisma.vehicleMake.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getMakeBySlug(slug: string) {
    return this.prisma.vehicleMake.findUnique({
      where: { slug },
      include: { models: true },
    });
  }

  async getModelsByMake(makeId: string) {
    return this.prisma.vehicleModel.findMany({
      where: { makeId },
      orderBy: { name: 'asc' },
    });
  }

  async createMake(data: { name: string; slug: string; logo?: string; country?: string; isPopular?: boolean }) {
    return this.prisma.vehicleMake.create({ data });
  }

  async createModel(data: {
    makeId: string;
    name: string;
    slug: string;
    bodyTypes?: any[];
    yearStart?: number;
    yearEnd?: number;
    isPopular?: boolean;
  }) {
    return this.prisma.vehicleModel.create({ data });
  }

  async getBodyTypes() {
    return [
      { value: 'SEDAN', label: 'Sedan' },
      { value: 'SUV', label: 'SUV' },
      { value: 'COUPE', label: 'Coupe' },
      { value: 'CONVERTIBLE', label: 'Convertible' },
      { value: 'HATCHBACK', label: 'Hatchback' },
      { value: 'WAGON', label: 'Wagon' },
      { value: 'PICKUP', label: 'Pickup Truck' },
      { value: 'VAN', label: 'Van' },
      { value: 'MINIVAN', label: 'Minivan' },
      { value: 'CROSSOVER', label: 'Crossover' },
      { value: 'SPORTS_CAR', label: 'Sports Car' },
      { value: 'LUXURY', label: 'Luxury' },
      { value: 'OTHER', label: 'Other' },
    ];
  }

  async getFuelTypes() {
    return [
      { value: 'GASOLINE', label: 'Gasoline' },
      { value: 'DIESEL', label: 'Diesel' },
      { value: 'ELECTRIC', label: 'Electric' },
      { value: 'HYBRID', label: 'Hybrid' },
      { value: 'PLUG_IN_HYBRID', label: 'Plug-in Hybrid' },
      { value: 'NATURAL_GAS', label: 'Natural Gas' },
      { value: 'HYDROGEN', label: 'Hydrogen' },
    ];
  }

  async getTransmissionTypes() {
    return [
      { value: 'AUTOMATIC', label: 'Automatic' },
      { value: 'MANUAL', label: 'Manual' },
      { value: 'CVT', label: 'CVT' },
      { value: 'DCT', label: 'Dual-Clutch' },
      { value: 'SEMI_AUTOMATIC', label: 'Semi-Automatic' },
    ];
  }

  async getDriveTypes() {
    return [
      { value: 'FWD', label: 'Front-Wheel Drive' },
      { value: 'RWD', label: 'Rear-Wheel Drive' },
      { value: 'AWD', label: 'All-Wheel Drive' },
      { value: 'FOUR_WD', label: '4WD' },
    ];
  }

  async getYearRange() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= 1980; year--) {
      years.push(year);
    }
    return years;
  }

  async seedPopularMakes() {
    const makes = [
      { name: 'Toyota', slug: 'toyota', country: 'Japan', isPopular: true },
      { name: 'Honda', slug: 'honda', country: 'Japan', isPopular: true },
      { name: 'Ford', slug: 'ford', country: 'USA', isPopular: true },
      { name: 'Chevrolet', slug: 'chevrolet', country: 'USA', isPopular: true },
      { name: 'BMW', slug: 'bmw', country: 'Germany', isPopular: true },
      { name: 'Mercedes-Benz', slug: 'mercedes-benz', country: 'Germany', isPopular: true },
      { name: 'Audi', slug: 'audi', country: 'Germany', isPopular: true },
      { name: 'Volkswagen', slug: 'volkswagen', country: 'Germany', isPopular: true },
      { name: 'Hyundai', slug: 'hyundai', country: 'South Korea', isPopular: true },
      { name: 'Kia', slug: 'kia', country: 'South Korea', isPopular: true },
      { name: 'Nissan', slug: 'nissan', country: 'Japan', isPopular: true },
      { name: 'Mazda', slug: 'mazda', country: 'Japan', isPopular: true },
      { name: 'Subaru', slug: 'subaru', country: 'Japan', isPopular: true },
      { name: 'Lexus', slug: 'lexus', country: 'Japan', isPopular: true },
      { name: 'Jeep', slug: 'jeep', country: 'USA', isPopular: true },
      { name: 'RAM', slug: 'ram', country: 'USA', isPopular: true },
      { name: 'GMC', slug: 'gmc', country: 'USA', isPopular: true },
      { name: 'Tesla', slug: 'tesla', country: 'USA', isPopular: true },
      { name: 'Porsche', slug: 'porsche', country: 'Germany', isPopular: true },
      { name: 'Volvo', slug: 'volvo', country: 'Sweden', isPopular: true },
    ];

    for (const make of makes) {
      await this.prisma.vehicleMake.upsert({
        where: { slug: make.slug },
        update: make,
        create: make,
      });
    }

    return { message: 'Popular makes seeded successfully', count: makes.length };
  }
}

