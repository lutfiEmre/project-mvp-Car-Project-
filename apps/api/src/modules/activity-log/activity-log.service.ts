import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogActivityDto {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(data: LogActivityDto) {
    return this.prisma.activityLog.create({
      data,
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 50, userId, action, entity, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.activityLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { action: true },
    });

    return logs.map((log) => ({
      action: log.action,
      count: log._count.action,
    }));
  }

  async seedSampleLogs() {
    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const dealer = await this.prisma.user.findFirst({ where: { role: 'DEALER' } });

    if (!admin) {
      throw new Error('No admin user found');
    }

    const now = new Date();
    const logs = [
      {
        userId: admin.id,
        action: 'User Login',
        entity: 'Auth',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 10 * 60 * 1000),
      },
      {
        userId: dealer?.id,
        action: 'Listing Created',
        entity: 'Listing',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'User Suspended',
        entity: 'User',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 35 * 60 * 1000),
      },
      {
        action: 'Failed Login Attempt',
        entity: 'Auth',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 40 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'Settings Updated',
        entity: 'Settings',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'Dealer Verified',
        entity: 'Dealer',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 50 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'Listing Rejected',
        entity: 'Listing',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 55 * 60 * 1000),
      },
      {
        userId: dealer?.id,
        action: 'Listing Created',
        entity: 'Listing',
        ipAddress: '192.168.1.4',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'User Created',
        entity: 'User',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        userId: dealer?.id,
        action: 'Listing Updated',
        entity: 'Listing',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ];

    // Delete existing logs
    await this.prisma.activityLog.deleteMany();

    // Create new logs
    const created = await Promise.all(
      logs.map((log) => this.prisma.activityLog.create({ data: log }))
    );

    return {
      message: `Created ${created.length} activity logs`,
      count: created.length,
    };
  }
}

