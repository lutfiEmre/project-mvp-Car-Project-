import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.prisma.listing.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
    });
  }

  async rejectListing(id: string, reason?: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
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
          },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return inquiry;
  }
}

