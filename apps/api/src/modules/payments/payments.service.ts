import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async getPaymentHistory(dealerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { dealerId },
        include: {
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
      this.prisma.payment.count({ where: { dealerId } }),
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

  async getPaymentById(id: string, dealerId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, dealerId },
      include: {
        subscription: true,
        dealer: {
          select: {
            businessName: true,
            address: true,
            city: true,
            province: true,
            postalCode: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getInvoice(id: string, dealerId: string) {
    const payment = await this.getPaymentById(id, dealerId);

    return {
      invoiceNumber: payment.invoiceNumber,
      date: payment.createdAt,
      paidAt: payment.paidAt,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      description: payment.description,
      dealer: payment.dealer,
      subscription: payment.subscription,
    };
  }

  async getOrCreateStripeCustomer(dealerId: string) {
    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dealerId },
      include: { user: true },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    if (dealer.stripeCustomerId) {
      try {
        const customer = await this.stripe.customers.retrieve(dealer.stripeCustomerId);
        if (!customer.deleted) {
          return dealer.stripeCustomerId;
        }
      } catch (error) {
        console.error('Error retrieving Stripe customer:', error);
      }
    }

    const customer = await this.stripe.customers.create({
      email: dealer.user.email,
      name: dealer.businessName,
      metadata: {
        dealerId: dealer.id,
        userId: dealer.userId,
      },
    });

    await this.prisma.dealer.update({
      where: { id: dealerId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(dealerId: string, plan: string, billingCycle: 'monthly' | 'yearly' = 'monthly') {
    const planDetails = await this.subscriptionsService.getPlanDetails(plan as any);
    if (!planDetails) {
      throw new BadRequestException('Invalid plan');
    }

    const price = billingCycle === 'yearly' ? planDetails.price * 10 : planDetails.price;
    const stripeCustomerId = await this.getOrCreateStripeCustomer(dealerId);

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `${plan} Plan - ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
              description: planDetails.description || `${plan} subscription plan`,
            },
            unit_amount: Math.round(Number(price) * 100),
            recurring: {
              interval: billingCycle === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/dealer/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/dealer/billing?canceled=true`,
      metadata: {
        dealerId,
        plan,
        billingCycle,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured. Webhook verification skipped. This is not recommended for production.');
    }

    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } else {
        event = JSON.parse(payload.toString()) as Stripe.Event;
        console.warn('⚠️ Processing webhook without signature verification (development mode)');
      }
    } catch (err) {
      console.error('Webhook processing failed:', err);
      if (webhookSecret) {
        throw new BadRequestException('Invalid webhook signature');
      }
      throw new BadRequestException('Failed to process webhook');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaymentFailed(invoice);
        break;
      }
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const dealerId = session.metadata?.dealerId;
    const plan = session.metadata?.plan;
    const billingCycle = session.metadata?.billingCycle as 'monthly' | 'yearly';

    if (!dealerId || !plan) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
    
    const subscriptionRecord = await this.subscriptionsService.create(
      dealerId,
      plan as any,
      billingCycle || 'monthly',
    );

    await this.prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: { stripeSubscriptionId: subscription.id },
    });

    const amount = session.amount_total ? Number(session.amount_total) / 100 : 0;
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await this.prisma.payment.create({
      data: {
        dealerId,
        subscriptionId: subscriptionRecord.id,
        amount: amount,
        currency: 'CAD',
        status: 'COMPLETED',
        paymentMethod: 'card',
        transactionId: session.payment_intent as string,
        invoiceNumber,
        stripeCustomerId: session.customer as string,
        stripePaymentIntentId: session.payment_intent as string,
        stripeSubscriptionId: subscription.id,
        stripeCheckoutSessionId: session.id,
        paidAt: new Date(),
        description: `${plan} Plan - ${billingCycle || 'monthly'}`,
      },
    });
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const subscriptionRecord = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!subscriptionRecord) {
      return;
    }

    const statusMap: Record<string, any> = {
      active: 'ACTIVE',
      canceled: 'CANCELLED',
      past_due: 'PAST_DUE',
      unpaid: 'EXPIRED',
    };

    await this.prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: statusMap[subscription.status] || 'ACTIVE',
        endDate: new Date((subscription as any).current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const subscriptionRecord = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!subscriptionRecord) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const invoiceAny = invoice as any;
    const subscription = invoiceAny.subscription as string | Stripe.Subscription | null;
    const subscriptionId = typeof subscription === 'string' 
      ? subscription 
      : subscription?.id;
    if (!subscriptionId) return;

    const subscriptionRecord = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscriptionRecord) return;

    // Payment model requires dealerId, so skip if subscription doesn't have one
    if (!subscriptionRecord.dealerId) {
      console.warn(`Skipping payment creation: subscription ${subscriptionRecord.id} has no dealerId`);
      return;
    }

    const amount = invoice.amount_paid ? Number(invoice.amount_paid) / 100 : 0;
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const paymentIntent = invoiceAny.payment_intent as string | Stripe.PaymentIntent | null;
    const paymentIntentId = typeof paymentIntent === 'string' 
      ? paymentIntent 
      : paymentIntent?.id;

    await this.prisma.payment.create({
      data: {
        dealerId: subscriptionRecord.dealerId,
        subscriptionId: subscriptionRecord.id,
        amount: amount,
        currency: 'CAD',
        status: 'COMPLETED',
        paymentMethod: 'card',
        transactionId: paymentIntentId || undefined,
        invoiceNumber,
        stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || undefined,
        stripePaymentIntentId: paymentIntentId || undefined,
        stripeSubscriptionId: subscriptionId,
        paidAt: new Date(),
        description: `Subscription renewal - ${subscriptionRecord.plan}`,
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const invoiceAny = invoice as any;
    const subscription = invoiceAny.subscription as string | Stripe.Subscription | null;
    const subscriptionId = typeof subscription === 'string' 
      ? subscription 
      : subscription?.id;
    if (!subscriptionId) return;

    const subscriptionRecord = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!subscriptionRecord) return;

    await this.prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: 'PAST_DUE',
      },
    });
  }

  async cancelSubscription(dealerId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        dealerId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.stripeSubscriptionId) {
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    return this.subscriptionsService.cancel(subscription.id, dealerId);
  }

  async createPayment(data: {
    dealerId: string;
    subscriptionId?: string;
    amount: number;
    currency?: string;
    description?: string;
    paymentMethod?: string;
    transactionId?: string;
  }) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return this.prisma.payment.create({
      data: {
        ...data,
        currency: data.currency || 'CAD',
        invoiceNumber,
        status: 'PENDING',
      },
    });
  }

  async updatePaymentStatus(
    id: string,
    status: 'COMPLETED' | 'FAILED' | 'REFUNDED',
    transactionId?: string,
  ) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
        transactionId,
        paidAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  async getTotalRevenue(startDate?: Date, endDate?: Date) {
    const where: any = { status: 'COMPLETED' };
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) where.paidAt.gte = startDate;
      if (endDate) where.paidAt.lte = endDate;
    }

    const result = await this.prisma.payment.aggregate({
      where,
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
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
}
