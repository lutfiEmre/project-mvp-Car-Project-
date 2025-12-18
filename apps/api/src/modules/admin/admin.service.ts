import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalDealers,
      totalListings,
      activeListings,
      pendingListings,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.dealer.count(),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    // Get recent registrations
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const newUsersLast30Days = await this.prisma.user.count({
      where: { createdAt: { gte: last30Days } },
    });

    const newListingsLast30Days = await this.prisma.listing.count({
      where: { createdAt: { gte: last30Days } },
    });

    return {
      totalUsers,
      totalDealers,
      totalListings,
      activeListings,
      pendingListings,
      totalRevenue: totalRevenue._sum.amount || 0,
      newUsersLast30Days,
      newListingsLast30Days,
    };
  }

  async getAllListings(page: number = 1, limit: number = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
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
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getPendingListings(page: number = 1, limit: number = 20) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          dealer: { select: { id: true, businessName: true } },
          media: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: 'asc' },
        skip: skip,
        take: limitNum,
      }),
      this.prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    return {
      data: listings,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async approveListing(id: string) {
    const listing = await this.prisma.listing.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
    });

    // Send approval email
    if (listing.user) {
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      const listingUrl = `${frontendUrl}/vehicles/${listing.slug}`;
      
      this.emailService.sendListingApprovedEmail(
        listing.user.email,
        listing.user.firstName,
        listing.title,
        listingUrl,
      ).catch((error) => {
        console.error('Failed to send listing approval email:', error);
      });
    }

    return updated;
  }

  async rejectListing(id: string, reason?: string) {
    const listing = await this.prisma.listing.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // Send rejection email
    if (listing.user) {
      this.emailService.sendListingRejectedEmail(
        listing.user.email,
        listing.user.firstName,
        listing.title,
        reason,
      ).catch((error) => {
        console.error('Failed to send listing rejection email:', error);
      });
    }

    return updated;
  }

  async getAllUsers(params: { page?: number; limit?: number; role?: string; status?: string }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;
    const { role, status } = params;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          dealer: { select: { id: true, businessName: true, verified: true } },
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserStatus(userId: string, status: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });
  }

  async getAllDealers(params: { page?: number; limit?: number; verified?: boolean }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;
    const { verified } = params;

    const where: any = {};
    if (verified !== undefined) where.verified = verified;

    const [dealers, total] = await Promise.all([
      this.prisma.dealer.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true, status: true } },
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      this.prisma.dealer.count({ where }),
    ]);

    return {
      data: dealers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async verifyDealer(dealerId: string) {
    return this.prisma.dealer.update({
      where: { id: dealerId },
      data: { verified: true, verifiedAt: new Date() },
    });
  }

  async getSystemSettings() {
    return this.prisma.systemSetting.findMany();
  }

  async updateSystemSetting(key: string, value: any) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getMaintenanceMode() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'maintenanceMode' },
    });
    const messageSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'maintenanceMessage' },
    });
    
    return {
      maintenanceMode: setting?.value === true || setting?.value === 'true',
      maintenanceMessage: messageSetting?.value || "We're currently performing scheduled maintenance. Please check back soon!",
    };
  }

  async getAnalytics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all users and group by date
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Get all listings
    const listings = await this.prisma.listing.findMany({
      where: { createdAt: { gte: startDate } },
      select: { bodyType: true, city: true, province: true },
    });

    // Get all payments
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, amount: true },
    });

    // Group users by date
    const userGrowthMap = new Map<string, number>();
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
    });
    const userGrowthData = Array.from(userGrowthMap.entries())
      .map(([date, users]) => ({ date, users }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group listings by category
    const categoryMap = new Map<string, number>();
    listings.forEach((listing) => {
      const category = listing.bodyType || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    const categoryData = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    // Group revenue by date
    const revenueMap = new Map<string, number>();
    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      const amount = payment.amount ? Number(payment.amount) : 0;
      revenueMap.set(date, (revenueMap.get(date) || 0) + amount);
    });
    const revenueDataFormatted = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group listings by location
    const locationMap = new Map<string, number>();
    listings.forEach((listing) => {
      if (listing.city && listing.province) {
        const location = `${listing.city}, ${listing.province}`;
        locationMap.set(location, (locationMap.get(location) || 0) + 1);
      }
    });
    const locationsData = Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      userGrowth: userGrowthData,
      listingsByCategory: categoryData,
      revenueOverTime: revenueDataFormatted,
      topLocations: locationsData,
    };
  }

  async suspendDealer(dealerId: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dealerId },
      include: { user: true },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    // Suspend the user account
    await this.prisma.user.update({
      where: { id: dealer.userId },
      data: { status: 'SUSPENDED' },
    });

    return dealer;
  }

  async deleteListing(id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.prisma.listing.delete({ where: { id } });
  }

  async getDealerInquiries(dealerId: string, params: {
    skip?: number;
    take?: number;
    status?: string;
  }) {
    const { skip = 0, take = 50, status } = params;

    const where: any = {
      dealerId,
      ...(status && status !== 'all' ? { status } : {}),
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

  async getInquiryById(inquiryId: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
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
        dealer: {
          select: {
            id: true,
            businessName: true,
            logo: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return inquiry;
  }

  async getAllInquiries(params: {
    skip?: number;
    take?: number;
    status?: string;
  }) {
    const { skip = 0, take = 50, status } = params;

    const where: any = {
      ...(status && status !== 'all' ? { status } : {}),
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
          dealer: {
            select: {
              id: true,
              businessName: true,
              logo: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
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

  async getActivityLogs(params: { page?: number; limit?: number; action?: string; entity?: string }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.action) where.action = params.action;
    if (params.entity) where.entity = params.entity;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createActivityLog(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    return this.prisma.activityLog.create({ data });
  }

  async getRecentActivity(limit: number = 10) {
    const logs = await this.prisma.activityLog.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const oldRole = user.role;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    await this.createActivityLog({
      userId,
      action: 'ROLE_CHANGED',
      entity: 'USER',
      entityId: userId,
      oldValues: { role: oldRole },
      newValues: { role },
    });

    return updated;
  }

  async suspendUser(userId: string, reason: string, duration?: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    await this.createActivityLog({
      userId,
      action: 'USER_SUSPENDED',
      entity: 'USER',
      entityId: userId,
      metadata: { reason, duration },
    });

    return updated;
  }

  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await this.createActivityLog({
      userId,
      action: 'USER_ACTIVATED',
      entity: 'USER',
      entityId: userId,
    });

    return updated;
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.createActivityLog({
      action: 'USER_DELETED',
      entity: 'USER',
      entityId: userId,
      metadata: { email: user.email, firstName: user.firstName, lastName: user.lastName },
    });

    return this.prisma.user.delete({ where: { id: userId } });
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealer: true,
        listings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { listings: true, savedListings: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getDealerById(dealerId: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dealerId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, status: true, createdAt: true },
        },
        listings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
        _count: {
          select: { listings: true, reviews: true, inquiries: true },
        },
      },
    });

    if (!dealer) throw new NotFoundException('Dealer not found');
    return dealer;
  }

  async unverifyDealer(dealerId: string) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const updated = await this.prisma.dealer.update({
      where: { id: dealerId },
      data: { verified: false, verifiedAt: null },
    });

    await this.createActivityLog({
      action: 'DEALER_UNVERIFIED',
      entity: 'DEALER',
      entityId: dealerId,
    });

    return updated;
  }

  async updateListingStatus(listingId: string, status: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: status as any },
    });

    await this.createActivityLog({
      action: 'LISTING_STATUS_CHANGED',
      entity: 'LISTING',
      entityId: listingId,
      oldValues: { status: listing.status },
      newValues: { status },
    });

    return updated;
  }

  async featureListing(listingId: string, featured: boolean, days?: number, featuredOrder?: number, userId?: string) {
    const listing = await this.prisma.listing.findUnique({ 
      where: { id: listingId },
      include: { dealer: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    if (featured && listing.dealerId) {
      const limits = await this.subscriptionsService.checkLimits(listing.dealerId);
      
      const currentFeaturedCount = await this.prisma.listing.count({
        where: {
          dealerId: listing.dealerId,
          featured: true,
          id: { not: listingId },
          OR: [
            { featuredUntil: null },
            { featuredUntil: { gt: new Date() } },
          ],
        },
      });

      if (limits.featuredListings !== -1 && currentFeaturedCount >= limits.featuredListings) {
        throw new BadRequestException(
          `Dealer has reached featured listing limit (${limits.featuredListings}).`
        );
      }
    }

    const featuredUntil = featured && days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
    
    const maxOrder = featured ? await this.prisma.listing.aggregate({
      where: { featured: true },
      _max: { featuredOrder: true },
    }) : null;

    // Check max 10 featured listings limit
    if (featured) {
      const currentFeaturedCount = await this.prisma.listing.count({
        where: {
          featured: true,
          OR: [
            { featuredUntil: null },
            { featuredUntil: { gt: new Date() } },
          ],
        },
      });

      if (currentFeaturedCount >= 10 && !listing.featured) {
        throw new BadRequestException('Maximum 10 featured listings allowed. Please remove one before adding another.');
      }

      // Validate featuredOrder if provided
      if (featuredOrder !== undefined && featuredOrder > 10) {
        throw new BadRequestException('Featured order cannot exceed 10. Maximum 10 featured listings allowed.');
      }
    }

    const order = featuredOrder !== undefined 
      ? featuredOrder 
      : featured && maxOrder && maxOrder._max && maxOrder._max.featuredOrder !== null 
        ? (maxOrder._max.featuredOrder || 0) + 1 
        : null;

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { 
        featured, 
        featuredUntil,
        featuredOrder: order,
        featuredRequestStatus: featured ? 'APPROVED' : 'NONE',
      },
    });

    await this.createActivityLog({
      userId: userId || undefined,
      action: featured ? 'LISTING_FEATURED' : 'LISTING_UNFEATURED',
      entity: 'LISTING',
      entityId: listingId,
      newValues: {
        featured,
        featuredUntil: featuredUntil ? featuredUntil.toISOString() : null,
        featuredOrder: order,
        listingTitle: listing.title,
        listingSlug: listing.slug,
      },
      oldValues: {
        featured: listing.featured,
        featuredUntil: listing.featuredUntil ? listing.featuredUntil.toISOString() : null,
        featuredOrder: listing.featuredOrder,
      },
      metadata: {
        days: days || null,
        dealerId: listing.dealerId,
        dealerName: listing.dealer?.businessName || null,
      },
    });

    return updated;
  }

  async getFeaturedRequests() {
    return this.prisma.listing.findMany({
      where: {
        featuredRequestStatus: 'PENDING',
      },
      include: {
        dealer: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFeaturedOrder(listingId: string, newOrder: number, userId?: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    if (!listing.featured) {
      throw new BadRequestException('Listing is not featured');
    }

    if (newOrder < 0 || newOrder > 9) {
      throw new BadRequestException('Featured order must be between 0 and 9');
    }

    const oldOrder = listing.featuredOrder;
    
    // Get all featured listings ordered by featuredOrder
    const allFeatured = await this.prisma.listing.findMany({
      where: {
        featured: true,
        featuredOrder: { not: null },
      },
      orderBy: { featuredOrder: 'asc' },
    });

    // Create a new order array
    const orders = allFeatured.map((l, index) => ({
      id: l.id,
      currentOrder: l.featuredOrder!,
      newOrder: index,
    }));

    // Find the target listing and move it
    const targetIndex = orders.findIndex(o => o.id === listingId);
    if (targetIndex === -1) {
      // Listing has no order, add it at the end
      orders.push({ id: listingId, currentOrder: -1, newOrder });
    } else {
      // Remove from current position
      const [moved] = orders.splice(targetIndex, 1);
      // Insert at new position
      orders.splice(newOrder, 0, { ...moved, newOrder });
      // Recalculate all orders
      orders.forEach((o, index) => {
        o.newOrder = index;
      });
    }

    // Update all affected listings
    const updates = orders
      .filter(o => o.currentOrder !== o.newOrder)
      .map(o => 
        this.prisma.listing.update({
          where: { id: o.id },
          data: { featuredOrder: o.newOrder },
        })
      );

    await Promise.all(updates);

    // Log activity
    await this.createActivityLog({
      userId: userId || undefined,
      action: 'LISTING_FEATURED_ORDER_UPDATED',
      entity: 'LISTING',
      entityId: listingId,
      oldValues: { featuredOrder: oldOrder },
      newValues: { featuredOrder: newOrder },
      metadata: {
        listingTitle: listing.title,
        listingSlug: listing.slug,
        oldPosition: oldOrder !== null ? oldOrder + 1 : null,
        newPosition: newOrder + 1,
      },
    });

    return this.prisma.listing.findUnique({ where: { id: listingId } });
  }

  async getFeaturedListings() {
    return this.prisma.listing.findMany({
      where: {
        featured: true,
        status: 'ACTIVE',
        OR: [
          { featuredUntil: null },
          { featuredUntil: { gt: new Date() } },
        ],
      },
      include: {
        dealer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: [
        { featuredOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getListingById(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        media: true,
        dealer: {
          select: { id: true, businessName: true, verified: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { inquiryMessages: true, savedBy: true },
        },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async getAllPayments(params: { page?: number; limit?: number; dealerId?: string }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.dealerId) {
      where.dealerId = params.dealerId;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          dealer: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          subscription: {
            select: {
              plan: true,
              billingCycle: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPlans() {
    const plans = await this.subscriptionsService.getPlans();
    const planMap: Record<string, any> = {};
    for (const plan of plans) {
      planMap[plan.plan] = {
        price: plan.price,
        maxListings: plan.maxListings,
        maxPhotosPerListing: plan.maxPhotosPerListing,
        featuredListings: plan.featuredListings,
        xmlImportEnabled: plan.xmlImportEnabled,
        analyticsEnabled: plan.analyticsEnabled,
        prioritySupport: plan.prioritySupport,
        description: plan.description,
      };
    }
    return planMap;
  }

  async updatePlan(plan: SubscriptionPlan, data: {
    price?: number;
    maxListings?: number;
    maxPhotosPerListing?: number;
    featuredListings?: number;
    xmlImportEnabled?: boolean;
    analyticsEnabled?: boolean;
    prioritySupport?: boolean;
    description?: string;
  }, userId?: string) {
    const settingKey = `plan_${plan.toLowerCase()}_details`;
    const existingPlan = await this.subscriptionsService.getPlanDetails(plan);
    
    const updatedDetails = {
      ...existingPlan,
      ...data,
    };

    await this.prisma.systemSetting.upsert({
      where: { key: settingKey },
      create: {
        key: settingKey,
        value: JSON.stringify(updatedDetails),
        description: `${plan} plan details`,
      },
      update: {
        value: JSON.stringify(updatedDetails),
      },
    });

    await this.createActivityLog({
      userId: userId || undefined,
      action: 'PLAN_UPDATED',
      entity: 'PLAN',
      entityId: plan,
      oldValues: existingPlan,
      newValues: updatedDetails,
      metadata: {
        planName: plan,
        changes: Object.keys(data).filter(key => existingPlan[key as keyof typeof existingPlan] !== data[key as keyof typeof data]),
      },
    });

    return updatedDetails;
  }

  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        dealer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upgradeDealerSubscription(
    dealerId: string | null,
    userId: string | null,
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'yearly',
    adminUserId?: string,
  ) {
    if (!dealerId && !userId) {
      throw new BadRequestException('Either dealerId or userId must be provided');
    }

    if (dealerId) {
      const dealer = await this.prisma.dealer.findUnique({
        where: { id: dealerId },
      });

      if (!dealer) {
        throw new NotFoundException('Dealer not found');
      }
    }

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const whereClause: any = {};

    if (dealerId) {
      whereClause.dealerId = dealerId;
    } else if (userId) {
      whereClause.userId = userId;
    }

    // Find the most recent subscription (regardless of status)
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (existingSubscription) {
      await this.prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
    }

    const planDetails = await this.subscriptionsService.getPlanDetails(plan);
    const startDate = new Date();
    const endDate = new Date();

    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const price = billingCycle === 'yearly'
      ? planDetails.price * 10
      : planDetails.price;

    const { description, ...planData } = planDetails;
    
    const subscription = await this.prisma.subscription.create({
      data: {
        dealerId: dealerId || null,
        userId: userId || null,
        plan,
        status: SubscriptionStatus.ACTIVE,
        ...planData,
        price,
        billingCycle,
        startDate,
        endDate,
      },
      include: {
        dealer: dealerId ? {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        } : undefined,
        user: userId ? {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        } : undefined,
      },
    });

    // Log activity
    const dealerName = dealerId ? (await this.prisma.dealer.findUnique({ where: { id: dealerId }, include: { user: true } }))?.businessName : null;
    const userName = userId ? (await this.prisma.user.findUnique({ where: { id: userId } }))?.email : null;
    
    await this.createActivityLog({
      userId: adminUserId || undefined,
      action: 'SUBSCRIPTION_UPGRADED',
      entity: 'SUBSCRIPTION',
      entityId: subscription.id,
      oldValues: existingSubscription ? {
        plan: existingSubscription.plan,
        status: existingSubscription.status,
        billingCycle: existingSubscription.billingCycle,
        price: existingSubscription.price,
      } : null,
      newValues: {
        plan: subscription.plan,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        price: subscription.price,
      },
      metadata: {
        dealerId: dealerId || null,
        dealerName: dealerName || null,
        userId: userId || null,
        userName: userName || null,
        planName: plan,
        billingCycle,
      },
    });

    return subscription;
  }

  async sendTestEmail(email: string) {
    await this.emailService.sendTestEmail(email);
    return { message: 'Test email sent successfully' };
  }
}

