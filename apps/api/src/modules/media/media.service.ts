import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaType } from '@prisma/client';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async uploadSingle(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const baseUrl = this.configService.get('API_URL', 'http://localhost:3001');
    const url = `${baseUrl}/uploads/${file.filename}`;

    return {
      url,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadForListing(
    listingId: string,
    files: Express.Multer.File[],
    userId: string,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { dealer: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new BadRequestException('Not authorized to upload to this listing');
    }

    const existingCount = await this.prisma.mediaFile.count({
      where: { listingId },
    });

    if (listing.dealerId) {
      const limits = await this.subscriptionsService.checkLimits(listing.dealerId);
      
      if (existingCount + files.length > limits.maxPhotosPerListing) {
        throw new BadRequestException(
          `You can only upload ${limits.maxPhotosPerListing} photos per listing. You currently have ${existingCount} photos.`
        );
      }
    }

    const mediaFiles = await Promise.all(
      files.map(async (file, index) => {
        const isImage = file.mimetype.startsWith('image/');
        const baseUrl = this.configService.get('API_URL', 'http://localhost:3001');
        const url = `${baseUrl}/uploads/${file.filename}`;

        return this.prisma.mediaFile.create({
          data: {
            listingId,
            fileName: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            type: isImage ? MediaType.IMAGE : MediaType.VIDEO,
            url,
            order: existingCount + index,
            isPrimary: existingCount === 0 && index === 0,
          },
        });
      }),
    );

    return mediaFiles;
  }

  async setAsPrimary(mediaId: string, userId: string) {
    const media = await this.prisma.mediaFile.findUnique({
      where: { id: mediaId },
      include: { listing: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.listing?.userId !== userId) {
      throw new BadRequestException('Not authorized');
    }

    // Remove primary from all other media
    await this.prisma.mediaFile.updateMany({
      where: { listingId: media.listingId },
      data: { isPrimary: false },
    });

    // Set this as primary
    return this.prisma.mediaFile.update({
      where: { id: mediaId },
      data: { isPrimary: true },
    });
  }

  async reorder(listingId: string, mediaIds: string[], userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.userId !== userId) {
      throw new BadRequestException('Not authorized');
    }

    await Promise.all(
      mediaIds.map((id, index) =>
        this.prisma.mediaFile.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { message: 'Media reordered successfully' };
  }

  async delete(mediaId: string, userId: string) {
    const media = await this.prisma.mediaFile.findUnique({
      where: { id: mediaId },
      include: { listing: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.listing?.userId !== userId) {
      throw new BadRequestException('Not authorized');
    }

    // Delete file from disk
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const filePath = path.join(uploadDir, media.fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await this.prisma.mediaFile.delete({
      where: { id: mediaId },
    });

    // If was primary, set next one as primary
    if (media.isPrimary) {
      const nextMedia = await this.prisma.mediaFile.findFirst({
        where: { listingId: media.listingId },
        orderBy: { order: 'asc' },
      });

      if (nextMedia) {
        await this.prisma.mediaFile.update({
          where: { id: nextMedia.id },
          data: { isPrimary: true },
        });
      }
    }

    return { message: 'Media deleted successfully' };
  }

  async getByListing(listingId: string) {
    return this.prisma.mediaFile.findMany({
      where: { listingId },
      orderBy: { order: 'asc' },
    });
  }
}

