import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Media')
@Controller({ path: 'media', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('listings/:listingId')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiOperation({ summary: 'Upload media for a listing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadForListing(
    @Param('listingId') listingId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('sub') userId: string,
  ) {
    return this.mediaService.uploadForListing(listingId, files, userId);
  }

  @Get('listings/:listingId')
  @ApiOperation({ summary: 'Get media for a listing' })
  async getByListing(@Param('listingId') listingId: string) {
    return this.mediaService.getByListing(listingId);
  }

  @Patch(':id/primary')
  @ApiOperation({ summary: 'Set media as primary' })
  async setAsPrimary(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.mediaService.setAsPrimary(id, userId);
  }

  @Patch('listings/:listingId/reorder')
  @ApiOperation({ summary: 'Reorder listing media' })
  async reorder(
    @Param('listingId') listingId: string,
    @Body('mediaIds') mediaIds: string[],
    @CurrentUser('sub') userId: string,
  ) {
    return this.mediaService.reorder(listingId, mediaIds, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  async delete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.mediaService.delete(id, userId);
  }
}

