import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehicleDataService } from './vehicle-data.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Vehicle Data')
@Controller('vehicle-data')
export class VehicleDataController {
  constructor(private readonly vehicleDataService: VehicleDataService) {}

  @Get('makes')
  @Public()
  @ApiOperation({ summary: 'Get all vehicle makes' })
  getMakes(@Query('popular') popular?: boolean) {
    return this.vehicleDataService.getAllMakes(popular);
  }

  @Get('makes/:slug')
  @Public()
  @ApiOperation({ summary: 'Get make by slug with models' })
  getMakeBySlug(@Param('slug') slug: string) {
    return this.vehicleDataService.getMakeBySlug(slug);
  }

  @Get('makes/:makeId/models')
  @Public()
  @ApiOperation({ summary: 'Get models by make ID' })
  getModelsByMake(@Param('makeId') makeId: string) {
    return this.vehicleDataService.getModelsByMake(makeId);
  }

  @Get('body-types')
  @Public()
  @ApiOperation({ summary: 'Get all body types' })
  getBodyTypes() {
    return this.vehicleDataService.getBodyTypes();
  }

  @Get('fuel-types')
  @Public()
  @ApiOperation({ summary: 'Get all fuel types' })
  getFuelTypes() {
    return this.vehicleDataService.getFuelTypes();
  }

  @Get('transmission-types')
  @Public()
  @ApiOperation({ summary: 'Get all transmission types' })
  getTransmissionTypes() {
    return this.vehicleDataService.getTransmissionTypes();
  }

  @Get('drive-types')
  @Public()
  @ApiOperation({ summary: 'Get all drive types' })
  getDriveTypes() {
    return this.vehicleDataService.getDriveTypes();
  }

  @Get('years')
  @Public()
  @ApiOperation({ summary: 'Get year range for vehicle selection' })
  getYears() {
    return this.vehicleDataService.getYearRange();
  }

  @Post('seed-makes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Seed popular vehicle makes (Admin only)' })
  seedMakes() {
    return this.vehicleDataService.seedPopularMakes();
  }
}

