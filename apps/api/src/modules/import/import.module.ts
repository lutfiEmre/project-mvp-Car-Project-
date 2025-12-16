import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ListingsModule } from '../listings/listings.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [PrismaModule, ListingsModule, MediaModule],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}

