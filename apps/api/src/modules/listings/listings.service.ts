import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingReviewDto } from './dto/create-listing-review.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { ListingStatus, UserRole, Prisma } from '@prisma/client';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateListingDto, dealerId?: string) {
    const slug = this.generateSlug(dto.title);

    return this.prisma.listing.create({
      data: {
        ...dto,
        userId,
        dealerId,
        slug,
        status: dto.status || ListingStatus.PENDING_APPROVAL, // Use provided status or default to PENDING_APPROVAL
        features: dto.features || [], // Ensure features is an array
        safetyFeatures: dto.safetyFeatures || [], // Ensure safetyFeatures is an array
      },
      include: {
        media: true,
      },
    });
  }

  async findAll(params: SearchListingsDto, user?: { role?: UserRole }) {
    const {
      skip = 0,
      take = 20,
      make,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      mileageMax,
      bodyType,
      fuelType,
      transmission,
      driveType,
      condition,
      city,
      province,
      dealerId,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ListingWhereInput = {
      // Admin can see all statuses, regular users only see ACTIVE
      ...(user?.role !== UserRole.ADMIN && { status: ListingStatus.ACTIVE }),
      ...(make && { make: { contains: make, mode: 'insensitive' } }),
      ...(model && { model: { contains: model, mode: 'insensitive' } }),
      ...(yearMin && { year: { gte: yearMin } }),
      ...(yearMax && { year: { lte: yearMax } }),
      ...(priceMin && { price: { gte: priceMin } }),
      ...(priceMax && { price: { lte: priceMax } }),
      ...(mileageMax && { mileage: { lte: mileageMax } }),
      ...(bodyType && { bodyType }),
      ...(fuelType && { fuelType }),
      ...(transmission && { transmission }),
      ...(driveType && { driveType }),
      ...(condition && { condition }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(province && { province }),
      ...(dealerId && { dealerId }),
      ...(featured && { featured: true }),
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          media: {
            orderBy: [
              { isPrimary: 'desc' },
              { order: 'asc' },
            ],
            take: 1,
          },
          dealer: {
            select: {
              id: true,
              businessName: true,
              city: true,
              verified: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async findBySlug(slug: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { slug },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
        dealer: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            city: true,
            province: true,
            contactPhone: true,
            contactEmail: true,
            verified: true,
            rating: true,
            reviewCount: true,
          },
        },
        reviews: {
          where: { isPublished: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        vehicleHistory: true,
      },
    });

    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count
    await this.prisma.listing.update({
      where: { id: listing.id },
      data: { views: { increment: 1 } },
    });

    return listing;
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
        dealer: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        vehicleHistory: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async getMyListings(userId: string, status?: ListingStatus, userRole?: UserRole) {
    // Get user's dealerId if exists
    let dealerId: string | undefined;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { dealer: { select: { id: true } } },
      });
      dealerId = user?.dealer?.id;
    } catch (error) {
      // If dealer lookup fails, try to find dealerId from listings
      console.error('Error fetching dealer for user:', error);
    }

    // Build where clause: user's own listings OR dealer's listings
    // Also include listings where dealerId matches (in case user is dealer but lookup failed)
    const whereClause: any = {
      OR: [
        { userId },
        ...(dealerId ? [{ dealerId }] : []),
      ],
      ...(status && { status }),
    };

    // If we have dealerId, also check listings with that dealerId (as fallback)
    if (!dealerId) {
      // Try to find dealerId from existing listings
      const listingWithDealer = await this.prisma.listing.findFirst({
        where: { userId },
        select: { dealerId: true },
      });
      if (listingWithDealer?.dealerId) {
        whereClause.OR.push({ dealerId: listingWithDealer.dealerId });
      }
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          media: {
            orderBy: [
              { isPrimary: 'desc' },
              { order: 'asc' },
            ],
            take: 1,
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          dealer: {
            select: {
              id: true,
              businessName: true,
              city: true,
              verified: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where: whereClause }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page: 1,
        limit: listings.length,
        totalPages: 1,
      },
    };
  }

  async getDealerListings(dealerId: string, status?: ListingStatus) {
    return this.prisma.listing.findMany({
      where: {
        dealerId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateListingDto, role: UserRole) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check permission
    if (role !== UserRole.ADMIN && listing.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this listing');
    }

    // Generate new slug if title changed
    let slug = listing.slug;
    if (dto.title && dto.title !== listing.title) {
      slug = this.generateSlug(dto.title);
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
      include: {
        media: true,
      },
    });
  }

  async updateStatus(id: string, status: ListingStatus) {
    return this.prisma.listing.update({
      where: { id },
      data: {
        status,
        ...(status === ListingStatus.ACTIVE && { publishedAt: new Date() }),
        ...(status === ListingStatus.SOLD && { soldAt: new Date() }),
      },
    });
  }

  async delete(id: string, userId: string, role: UserRole) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (role !== UserRole.ADMIN && listing.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this listing');
    }

    await this.prisma.listing.delete({ where: { id } });

    return { message: 'Listing deleted successfully' };
  }

  async getFeatured(take = 8) {
    return this.prisma.listing.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        featured: true,
        OR: [
          { featuredUntil: null },
          { featuredUntil: { gt: new Date() } },
        ],
      },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          where: { isPrimary: true },
          take: 1,
        },
        dealer: {
          select: {
            businessName: true,
            verified: true,
          },
        },
      },
    });
  }

  async getRecent(take = 12) {
    return this.prisma.listing.findMany({
      where: { status: ListingStatus.ACTIVE },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          where: { isPrimary: true },
          take: 1,
        },
        dealer: {
          select: {
            businessName: true,
            verified: true,
          },
        },
      },
    });
  }

  async getSimilar(listingId: string, take = 6) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return [];
    }

    return this.prisma.listing.findMany({
      where: {
        id: { not: listingId },
        status: ListingStatus.ACTIVE,
        OR: [
          { make: listing.make, model: listing.model },
          { bodyType: listing.bodyType, year: { gte: listing.year - 2, lte: listing.year + 2 } },
        ],
      },
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });
  }

  async getStats() {
    const [total, active, pending, sold] = await Promise.all([
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      this.prisma.listing.count({ where: { status: ListingStatus.PENDING_APPROVAL } }),
      this.prisma.listing.count({ where: { status: ListingStatus.SOLD } }),
    ]);

    return { total, active, pending, sold };
  }

  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const uniqueId = Date.now().toString(36);
    return `${baseSlug}-${uniqueId}`;
  }

  async createInquiry(data: {
    listingId: string;
    dealerId?: string;
    userId?: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
  }) {
    // Verify listing exists
    const listing = await this.findById(data.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Get dealerId from listing if not provided
    const dealerId = data.dealerId || listing.dealerId;
    if (!dealerId) {
      throw new Error('Dealer not found for this listing');
    }

    // Check if there's an existing inquiry for this listing+dealer+user
    const existingInquiry = await this.prisma.inquiry.findFirst({
      where: {
        listingId: data.listingId,
        dealerId: dealerId,
        userId: data.userId || null,
        status: {
          not: 'ARCHIVED', // Don't use archived inquiries
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
          },
        },
        dealer: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            city: true,
            province: true,
            contactPhone: true,
            contactEmail: true,
          },
        },
      },
    });

    // If existing inquiry found, update it instead of creating new
    if (existingInquiry) {
      // Append new message to existing message with timestamp (include seconds for better ordering)
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const updatedMessage = existingInquiry.message
        ? `${existingInquiry.message}\n\n--- ${timestamp} ---\n${data.message}`
        : data.message;

      const updatedInquiry = await this.prisma.inquiry.update({
        where: { id: existingInquiry.id },
        data: {
          message: updatedMessage,
          status: 'NEW', // Reset to NEW when new message is added
          updatedAt: new Date(),
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              make: true,
              model: true,
              year: true,
              slug: true,
              price: true,
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          dealer: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              city: true,
              province: true,
              contactPhone: true,
              contactEmail: true,
            },
          },
        },
      });

      // Create notification for dealer
      const dealer = await this.prisma.dealer.findUnique({
        where: { id: dealerId },
        include: { user: true },
      });

      if (dealer?.userId) {
        await this.prisma.notification.create({
          data: {
            userId: dealer.userId,
            type: 'INQUIRY',
            title: 'New Message Received',
            message: `${data.name} sent a new message about ${listing.year} ${listing.make} ${listing.model}`,
            data: {
              inquiryId: updatedInquiry.id,
              listingId: data.listingId,
            },
          },
        });
      }

      return {
        success: true,
        message: 'Message sent successfully',
        inquiryId: updatedInquiry.id,
        listingId: data.listingId,
        inquiry: updatedInquiry,
      };
    }

    // Create new inquiry if none exists
    console.log('Creating inquiry with userId:', data.userId);
    console.log('Inquiry data:', { listingId: data.listingId, dealerId, userId: data.userId, email: data.email });
    const inquiry = await this.prisma.inquiry.create({
      data: {
        listingId: data.listingId,
        dealerId: dealerId,
        userId: data.userId || null, // Explicitly set to null if undefined
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        status: 'NEW',
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            slug: true,
            price: true,
            media: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        dealer: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            city: true,
            province: true,
            contactPhone: true,
            contactEmail: true,
          },
        },
      },
    });

    // Increment inquiry count on listing (only for new inquiries)
    await this.prisma.listing.update({
      where: { id: data.listingId },
      data: {
        inquiries: { increment: 1 },
      },
    });

    // Create notification for dealer
    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dealerId },
      include: { user: true },
    });

    if (dealer?.userId) {
      await this.prisma.notification.create({
        data: {
          userId: dealer.userId,
          type: 'INQUIRY',
          title: 'New Inquiry Received',
          message: `${data.name} sent an inquiry about ${listing.year} ${listing.make} ${listing.model}`,
          data: {
            inquiryId: inquiry.id,
            listingId: data.listingId,
          },
        },
      });
    }
    
    return {
      success: true,
      message: 'Inquiry sent successfully',
      inquiryId: inquiry.id,
      listingId: data.listingId,
      inquiry: inquiry,
    };
  }

  async createReview(listingId: string, userId: string, dto: CreateListingReviewDto) {
    // Check if listing exists
    const listing = await this.findById(listingId);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already reviewed this listing
    const existingReview = await this.prisma.listingReview.findFirst({
      where: {
        listingId,
        reviewerEmail: user.email,
      },
    });

    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this listing');
    }

    // Create review
    const review = await this.prisma.listingReview.create({
      data: {
        listingId,
        reviewerName: `${user.firstName} ${user.lastName}`,
        reviewerEmail: user.email,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        isPublished: true, // Auto-publish for now
        isVerified: true, // Verified since user is logged in
      },
    });

    return review;
  }

  async getListingReviews(listingId: string) {
    const reviews = await this.prisma.listingReview.findMany({
      where: {
        listingId,
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  async respondToListingReview(reviewId: string, dealerId: string, response: string) {
    // Verify the review exists and belongs to a listing owned by this dealer
    const review = await this.prisma.listingReview.findUnique({
      where: { id: reviewId },
      include: {
        listing: {
          select: {
            dealerId: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.listing.dealerId !== dealerId) {
      throw new ForbiddenException('Not authorized to respond to this review');
    }

    return this.prisma.listingReview.update({
      where: { id: reviewId },
      data: {
        dealerResponse: response,
        dealerResponseAt: new Date(),
      },
    });
  }
}

