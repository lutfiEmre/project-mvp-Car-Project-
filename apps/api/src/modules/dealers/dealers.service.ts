import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { UpdateDealerDto } from './dto/update-dealer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DealersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDealerDto) {
    // Check if user already has a dealer profile
    const existingDealer = await this.prisma.dealer.findUnique({
      where: { userId },
    });

    if (existingDealer) {
      throw new ForbiddenException('User already has a dealer profile');
    }

    return this.prisma.dealer.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DealerWhereInput;
    orderBy?: Prisma.DealerOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [dealers, total] = await Promise.all([
      this.prisma.dealer.findMany({
        skip,
        take,
        where: { ...where, user: { status: 'ACTIVE' } },
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              listings: { where: { status: 'ACTIVE' } },
            },
          },
        },
      }),
      this.prisma.dealer.count({ where }),
    ]);

    return {
      data: dealers,
      meta: { total, skip: skip || 0, take: take || 20 },
    };
  }

  async findById(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
        listings: {
          where: { status: 'ACTIVE' },
          take: 12,
          orderBy: { createdAt: 'desc' },
          include: {
            media: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        reviews: {
          where: { isPublished: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        _count: {
          select: {
            listings: { where: { status: 'ACTIVE' } },
            reviews: { where: { isPublished: true } },
          },
        },
      },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    return dealer;
  }

  async findByUserId(userId: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        reviews: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            listings: true,
            reviews: { where: { isPublished: true } },
          },
        },
      },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer profile not found');
    }

    return dealer;
  }

  async getMyReviews(dealerId: string, params: {
    skip?: number;
    take?: number;
  }) {
    try {
      const { skip = 0, take = 50 } = params;

      // Debug: Check if dealer exists and has reviews
      const dealer = await this.prisma.dealer.findUnique({
        where: { id: dealerId },
        include: {
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      });

      if (!dealer) {
        throw new NotFoundException('Dealer not found');
      }

      console.log(`[getMyReviews] Dealer ID: ${dealerId}, Total reviews in DB: ${dealer._count.reviews}`);

      // Get dealer's listing IDs
      const dealerListings = await this.prisma.listing.findMany({
        where: { dealerId },
        select: { id: true },
      });
      const listingIds = dealerListings.map(l => l.id);

      console.log(`[getMyReviews] Found ${listingIds.length} listings for dealer`);

      // Get both dealer reviews and listing reviews
      const [dealerReviews, listingReviews, dealerReviewsCount, listingReviewsCount] = await Promise.all([
        this.prisma.dealerReview.findMany({
          where: { dealerId },
          orderBy: { createdAt: 'desc' },
        }),
        listingIds.length > 0 ? this.prisma.listingReview.findMany({
          where: { 
            listingId: { in: listingIds },
            isPublished: true,
          },
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }) : [],
        this.prisma.dealerReview.count({
          where: { dealerId },
        }),
        listingIds.length > 0 ? this.prisma.listingReview.count({
          where: { 
            listingId: { in: listingIds },
            isPublished: true,
          },
        }) : 0,
      ]);

      console.log(`[getMyReviews] Fetched ${dealerReviews.length} dealer reviews, ${listingReviews.length} listing reviews`);

      // Combine and format reviews
      const allReviews = [
        ...dealerReviews.map(r => ({
          ...r,
          type: 'dealer' as const,
          listing: null,
        })),
        ...listingReviews.map(r => ({
          ...r,
          type: 'listing' as const,
          // dealerResponse and dealerResponseAt are now in ListingReview schema
          listingId: r.listingId,
          listing: r.listing || null, // Include listing info
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = dealerReviewsCount + listingReviewsCount;
      const paginatedReviews = allReviews.slice(skip, skip + take);

      console.log(`[getMyReviews] Found ${dealerReviews.length} dealer reviews, ${listingReviews.length} listing reviews, total: ${total}`);

      return {
        data: paginatedReviews,
        meta: { total, skip, take },
      };
    } catch (error) {
      console.error('[getMyReviews] Error:', error);
      throw error;
    }
  }

  async update(id: string, userId: string, dto: UpdateDealerDto) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    if (dealer.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this dealer');
    }

    return this.prisma.dealer.update({
      where: { id },
      data: dto,
    });
  }

  async verify(id: string) {
    return this.prisma.dealer.update({
      where: { id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });
  }

  async getStats(dealerId: string) {
    const [listings, views, inquiries] = await Promise.all([
      this.prisma.listing.count({ where: { dealerId } }),
      this.prisma.listing.aggregate({
        where: { dealerId },
        _sum: { views: true },
      }),
      this.prisma.listing.aggregate({
        where: { dealerId },
        _sum: { inquiries: true },
      }),
    ]);

    return {
      totalListings: listings,
      totalViews: views._sum.views || 0,
      totalInquiries: inquiries._sum.inquiries || 0,
    };
  }

  async getPublicProfile(id: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id },
      select: {
        id: true,
        businessName: true,
        description: true,
        logo: true,
        bannerImage: true,
        website: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        businessHours: true,
        contactEmail: true,
        contactPhone: true,
        facebook: true,
        instagram: true,
        twitter: true,
        youtube: true,
        verified: true,
        rating: true,
        reviewCount: true,
        totalListings: true,
        createdAt: true,
        listings: {
          where: { status: 'ACTIVE' },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            media: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        reviews: {
          where: { isPublished: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    return dealer;
  }

  async createReview(dealerId: string, userId: string, dto: { rating: number; title?: string; content: string }) {
    // Check if dealer exists
    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already reviewed this dealer
    const existingReview = await this.prisma.dealerReview.findFirst({
      where: {
        dealerId,
        reviewerEmail: user.email,
      },
    });

    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this dealer');
    }

    // Create review
    const review = await this.prisma.dealerReview.create({
      data: {
        dealerId,
        reviewerName: `${user.firstName} ${user.lastName}`,
        reviewerEmail: user.email,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        isPublished: true, // Auto-publish for now
        isVerified: true, // Verified since user is logged in
      },
    });

    // Update dealer rating
    const allReviews = await this.prisma.dealerReview.findMany({
      where: { dealerId, isPublished: true },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await this.prisma.dealer.update({
      where: { id: dealerId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: allReviews.length,
      },
    });

    return review;
  }

  async getInquiries(dealerId: string, params: {
    skip?: number;
    take?: number;
    status?: string;
  }) {
    const { skip = 0, take = 50, status } = params;

    // Filter out dealer-archived inquiries unless explicitly requested
    const where: Prisma.InquiryWhereInput = {
      dealerId,
      // Filter by dealerArchived flag instead of status
      ...(status === 'ARCHIVED'
        ? { dealerArchived: true }
        : status === 'all'
        ? { dealerArchived: false } // Don't show archived in "all" view
        : status && status !== 'all'
        ? { dealerArchived: false, status }
        : { dealerArchived: false } // Default: don't show archived
      ),
    };

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              make: true,
              model: true,
              year: true,
              price: true,
              slug: true,
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.inquiry.count({ where }),
    ]);

    return {
      data: inquiries,
      meta: { total, skip, take },
    };
  }

  async getInquiryById(inquiryId: string, dealerId: string) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: {
        id: inquiryId,
        dealerId,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            price: true,
            slug: true,
            media: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return inquiry;
  }

  async updateInquiryStatus(inquiryId: string, dealerId: string, status: string, reply?: string) {
    const inquiry = await this.getInquiryById(inquiryId, dealerId);

    const updateData: any = {
      status: status === 'ARCHIVED' ? inquiry.status : status, // Don't change status if archiving
      isRead: true,
      readAt: new Date(),
    };

    // If archiving, set dealerArchived flag instead of changing status
    if (status === 'ARCHIVED') {
      updateData.dealerArchived = true;
    }

    if (reply) {
      // If there's an existing reply, append the new one with timestamp (include seconds for better ordering)
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
      
      const newReply = inquiry.reply
        ? `${inquiry.reply}\n\n--- ${timestamp} ---\n${reply}`
        : reply;
      
      updateData.reply = newReply;
      updateData.repliedAt = new Date();
      updateData.repliedBy = dealerId; // In real app, this would be the user ID
    }

    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: updateData,
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
      },
    });
  }

  async respondToReview(reviewId: string, dealerId: string, response: string) {
    // Verify the review belongs to this dealer
    const review = await this.prisma.dealerReview.findFirst({
      where: {
        id: reviewId,
        dealerId,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.dealerReview.update({
      where: { id: reviewId },
      data: {
        dealerResponse: response,
        dealerResponseAt: new Date(),
      },
    });
  }
}

