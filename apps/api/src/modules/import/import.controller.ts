import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Import')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DEALER')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('json')
  @ApiOperation({ summary: 'Import listings from JSON data' })
  async importJson(
    @CurrentUser('id') userId: string,
    @CurrentUser('dealer') dealer: any,
    @Body() data: { vehicles: any[] },
  ) {
    if (!dealer) {
      throw new BadRequestException('Dealer account required');
    }
    return this.importService.importFromJson(dealer.id, userId, data.vehicles);
  }

  @Post('xml')
  @ApiOperation({ summary: 'Import listings from XML file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importXml(
    @CurrentUser('id') userId: string,
    @CurrentUser('dealer') dealer: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!dealer) {
      throw new BadRequestException('Dealer account required');
    }
    if (!file) {
      throw new BadRequestException('XML file is required');
    }
    const xmlString = file.buffer.toString('utf-8');
    return this.importService.importFromXml(dealer.id, userId, xmlString);
  }
}

