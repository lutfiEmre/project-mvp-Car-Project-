import { Module } from '@nestjs/common';
import { VehicleDataService } from './vehicle-data.service';
import { VehicleDataController } from './vehicle-data.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleDataController],
  providers: [VehicleDataService],
  exports: [VehicleDataService],
})
export class VehicleDataModule {}

