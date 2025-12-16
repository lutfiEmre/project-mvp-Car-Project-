import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

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

  async createCheckoutSession(dealerId: string, plan: string) {
    return {
      message: 'Checkout session created',
      sessionId: `cs_${Date.now()}`,
      url: `https://checkout.stripe.com/pay/cs_${Date.now()}`,
    };
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
}

