import { PartialType } from '@nestjs/swagger';
import { CreateDealerDto } from './create-dealer.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl, IsObject } from 'class-validator';

export class UpdateDealerDto extends PartialType(CreateDealerDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  bannerImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  businessHours?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  youtube?: string;
}

