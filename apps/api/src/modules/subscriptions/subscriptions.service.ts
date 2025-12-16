import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const PLAN_DETAILS = {
  [SubscriptionPlan.FREE]: {
    price: 0,
    maxListings: 3,
    maxPhotosPerListing: 5,
    featuredListings: 0,
    xmlImportEnabled: false,
    analyticsEnabled: false,
    prioritySupport: false,
  },
  [SubscriptionPlan.STARTER]: {
    price: 49.99,
    maxListings: 25,
    maxPhotosPerListing: 15,
    featuredListings: 2,
    xmlImportEnabled: false,
    analyticsEnabled: true,
    prioritySupport: false,
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    price: 149.99,
    maxListings: 100,
    maxPhotosPerListing: 30,
    featuredListings: 10,
    xmlImportEnabled: true,
    analyticsEnabled: true,
    prioritySupport: true,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 399.99,
    maxListings: -1, // Unlimited
    maxPhotosPerListing: 50,
    featuredListings: 50,
    xmlImportEnabled: true,
    analyticsEnabled: true,
    prioritySupport: true,
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans() {
    return Object.entries(PLAN_DETAILS).map(([plan, details]) => ({
      plan,
      ...details,
    }));
  }

  async getActive(dealerId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        dealerId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gt: new Date() },
      },
    });
  }

  async create(dealerId: string, plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly') {
    const planDetails = PLAN_DETAILS[plan];
    
    // Check if already has active subscription
    const existing = await this.getActive(dealerId);
    if (existing) {
      throw new BadRequestException('Already has an active subscription');
    }

    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Apply yearly discount (2 months free)
    const price = billingCycle === 'yearly' 
      ? planDetails.price * 10 
      : planDetails.price;

    return this.prisma.subscription.create({
      data: {
        dealerId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        ...planDetails,
        price,
        billingCycle,
        startDate,
        endDate,
      },
    });
  }

  async cancel(subscriptionId: string, dealerId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.dealerId !== dealerId) {
      throw new BadRequestException('Not authorized');
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async upgrade(dealerId: string, newPlan: SubscriptionPlan) {
    const current = await this.getActive(dealerId);
    
    if (!current) {
      throw new BadRequestException('No active subscription to upgrade');
    }

    const newPlanDetails = PLAN_DETAILS[newPlan];

    // Mark current as cancelled
    await this.prisma.subscription.update({
      where: { id: current.id },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.subscription.create({
      data: {
        dealerId,
        plan: newPlan,
        status: SubscriptionStatus.ACTIVE,
        ...newPlanDetails,
        billingCycle: 'monthly',
        startDate,
        endDate,
      },
    });
  }

  async checkLimits(dealerId: string) {
    const subscription = await this.getActive(dealerId);
    
    if (!subscription) {
      // Return free tier limits
      return {
        plan: SubscriptionPlan.FREE,
        ...PLAN_DETAILS[SubscriptionPlan.FREE],
      };
    }

    return {
      plan: subscription.plan,
      maxListings: subscription.maxListings,
      maxPhotosPerListing: subscription.maxPhotosPerListing,
      featuredListings: subscription.featuredListings,
      xmlImportEnabled: subscription.xmlImportEnabled,
      analyticsEnabled: subscription.analyticsEnabled,
    };
  }

  async getHistory(dealerId: string) {
    return this.prisma.subscription.findMany({
      where: { dealerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

