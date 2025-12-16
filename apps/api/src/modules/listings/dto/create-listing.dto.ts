import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FuelType, TransmissionType, DriveType, BodyType, Condition, ListingStatus } from '@prisma/client';

export class CreateListingDto {
  @ApiProperty({ example: '2022 Toyota Camry SE' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Camry' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2022 })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiPropertyOptional({ example: 'SE' })
  @IsOptional()
  @IsString()
  trim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stockNumber?: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Min(0)
  mileage: number;

  @ApiPropertyOptional({ default: 'km' })
  @IsOptional()
  @IsString()
  mileageUnit?: string;

  @ApiProperty({ enum: FuelType })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ enum: TransmissionType })
  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @ApiProperty({ enum: DriveType })
  @IsEnum(DriveType)
  driveType: DriveType;

  @ApiProperty({ enum: BodyType })
  @IsEnum(BodyType)
  bodyType: BodyType;

  @ApiPropertyOptional({ enum: Condition, default: Condition.USED })
  @IsOptional()
  @IsEnum(Condition)
  condition?: Condition;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  engineSize?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  engineCylinders?: number;

  @ApiPropertyOptional({ example: 203 })
  @IsOptional()
  @IsNumber()
  horsepower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  torque?: number;

  @ApiPropertyOptional({ example: 'Pearl White' })
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  interiorColor?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  doors?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  seats?: number;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  originalPrice?: number;

  @ApiPropertyOptional({ default: 'CAD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  priceNegotiable?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  safetyFeatures?: string[];

  @ApiPropertyOptional({ example: 'Toronto' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Ontario' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 'M5V 1J2' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Canada', default: 'Canada' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: ListingStatus, default: ListingStatus.PENDING_APPROVAL })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}

