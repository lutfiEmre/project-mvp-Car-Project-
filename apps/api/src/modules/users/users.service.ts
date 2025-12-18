import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          dealer: {
            select: {
              id: true,
              businessName: true,
              verified: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        skip: skip || 0,
        take: take || 10,
      },
    };
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        bannerImage: true,
        city: true,
        province: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        dealer: true,
        listings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            status: true,
            createdAt: true,
          },
        },
        savedListings: {
          take: 10,
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { dealer: true },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async updateStatus(id: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateRole(id: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  async getSavedListings(userId: string) {
    return this.prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            media: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveListing(userId: string, listingId: string) {
    const existing = await this.prisma.savedListing.findUnique({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    if (existing) {
      throw new BadRequestException('Listing already saved');
    }

    return this.prisma.savedListing.create({
      data: { userId, listingId },
    });
  }

  async unsaveListing(userId: string, listingId: string) {
    await this.prisma.savedListing.delete({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    return { message: 'Listing removed from saved' };
  }

  async getInquiries(userId: string, params: {
    skip?: number;
    take?: number;
    where?: Prisma.InquiryWhereInput;
    orderBy?: Prisma.InquiryOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    // Filter out user-archived inquiries unless explicitly requested
    const statusFilter = where?.status;
    const whereClause: Prisma.InquiryWhereInput = {
      ...where,
      userId,
      // Filter by userArchived flag instead of status
      ...(statusFilter === 'ARCHIVED'
        ? { userArchived: true }
        : statusFilter === 'all'
        ? { userArchived: false } // Don't show archived in "all" view
        : statusFilter && statusFilter !== 'all'
        ? { userArchived: false, status: statusFilter }
        : { userArchived: false } // Default: don't show archived
      ),
    };

    const [inquiries, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              slug: true,
              make: true,
              model: true,
              year: true,
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
            },
          },
        },
      }),
      this.prisma.inquiry.count({ where: whereClause }),
    ]);

    return {
      data: inquiries,
      meta: { total, skip: skip || 0, take: take || 20 },
    };
  }

  async getInquiryById(userId: string, inquiryId: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId, userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            make: true,
            model: true,
            year: true,
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

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    return inquiry;
  }

  async archiveInquiry(userId: string, inquiryId: string) {
    const inquiry = await this.getInquiryById(userId, inquiryId);
    
    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        userArchived: true,
      },
    });
  }

  async markInquiryAsRead(userId: string, inquiryId: string) {
    const inquiry = await this.getInquiryById(userId, inquiryId);
    
    if (inquiry.userReadAt) {
      return inquiry;
    }
    
    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        userReadAt: new Date(),
      },
      include: {
        dealer: {
          select: { userId: true },
        },
      },
    });

    if (updated.dealer?.userId) {
      this.notificationsGateway.sendMessageRead(updated.dealer.userId, inquiryId, 'user');
    }

    return updated;
  }

  async sendMessage(userId: string, inquiryId: string, message: string) {
    const inquiry = await this.getInquiryById(userId, inquiryId);
    
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
    
    const newMessage = inquiry.message
      ? `${inquiry.message}\n\n--- ${timestamp} ---\n${message}`
      : message;
    
    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        message: newMessage,
        dealerReadAt: null,
        status: 'NEW',
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            make: true,
            model: true,
            year: true,
            price: true,
          },
        },
        dealer: {
          select: {
            id: true,
            businessName: true,
            userId: true,
          },
        },
      },
    });

    if (updated.dealer?.userId) {
      this.notificationsGateway.sendNewInquiry(updated.dealer.userId, updated);
    }

    return updated;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async requestAccountDeletion(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'ACCOUNT_DELETION_REQUEST',
          title: 'Account Deletion Request',
          message: `User ${user.firstName} ${user.lastName} (${user.email}) has requested account deletion.${reason ? ` Reason: ${reason}` : ''}`,
          data: { requestUserId: userId, reason },
        },
      });
    }

    return { message: 'Account deletion request submitted. Admin will review your request.' };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        avatar: true,
      },
    });
  }

  async getNotificationSettings(userId: string) {
    const settings = await this.prisma.systemSetting.findFirst({
      where: { key: `user_notification_settings_${userId}` },
    });

    return settings?.value || {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
    };
  }

  async updateNotificationSettings(userId: string, settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
  }) {
    const key = `user_notification_settings_${userId}`;
    
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: settings },
      create: { key, value: settings },
    });
  }
}

