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
    description: 'Free plan for getting started',
  },
  [SubscriptionPlan.STARTER]: {
    price: 49.99,
    maxListings: 25,
    maxPhotosPerListing: 15,
    featuredListings: 2,
    xmlImportEnabled: false,
    analyticsEnabled: true,
    prioritySupport: false,
    description: 'Perfect for small dealerships',
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    price: 149.99,
    maxListings: 100,
    maxPhotosPerListing: 30,
    featuredListings: 10,
    xmlImportEnabled: true,
    analyticsEnabled: true,
    prioritySupport: true,
    description: 'For growing businesses',
  },
  [SubscriptionPlan.ENTERPRISE]: {
    price: 399.99,
    maxListings: -1, // Unlimited
    maxPhotosPerListing: 50,
    featuredListings: 50,
    xmlImportEnabled: true,
    analyticsEnabled: true,
    prioritySupport: true,
    description: 'Unlimited listings and premium features',
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlanDetails(plan: SubscriptionPlan) {
    const settingKey = `plan_${plan.toLowerCase()}_details`;
    const savedPlan = await this.prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (savedPlan && savedPlan.value) {
      const savedDetails = typeof savedPlan.value === 'string' 
        ? JSON.parse(savedPlan.value) 
        : savedPlan.value;
      return { ...PLAN_DETAILS[plan], ...savedDetails };
    }

    return PLAN_DETAILS[plan];
  }

  async getPlans() {
    const plans = await Promise.all(
      Object.entries(PLAN_DETAILS).map(async ([plan, defaultDetails]) => {
        const settingKey = `plan_${plan.toLowerCase()}_details`;
        const savedPlan = await this.prisma.systemSetting.findUnique({
          where: { key: settingKey },
        });

        if (savedPlan && savedPlan.value) {
          const savedDetails = typeof savedPlan.value === 'string' 
            ? JSON.parse(savedPlan.value) 
            : savedPlan.value;
          return {
            plan,
            ...defaultDetails,
            ...savedDetails,
          };
        }

        return {
          plan,
          ...defaultDetails,
        };
      })
    );

    return plans;
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
    const planDetails = await this.getPlanDetails(plan);
    
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

    const { description, ...planData } = planDetails;

    return this.prisma.subscription.create({
      data: {
        dealerId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        ...planData,
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

    const newPlanDetails = await this.getPlanDetails(newPlan);

    // Mark current as cancelled
    await this.prisma.subscription.update({
      where: { id: current.id },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { description, ...planData } = newPlanDetails;

    return this.prisma.subscription.create({
      data: {
        dealerId,
        plan: newPlan,
        status: SubscriptionStatus.ACTIVE,
        ...planData,
        billingCycle: 'monthly',
        startDate,
        endDate,
      },
    });
  }

  async checkLimits(dealerId: string) {
    const subscription = await this.getActive(dealerId);
    
    if (!subscription) {
      const freePlanDetails = await this.getPlanDetails(SubscriptionPlan.FREE);
      return {
        plan: SubscriptionPlan.FREE,
        ...freePlanDetails,
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

