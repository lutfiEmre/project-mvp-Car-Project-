import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles('DEALER')
  @ApiOperation({ summary: 'Get payment history' })
  getPaymentHistory(
    @CurrentUser('dealer') dealer: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getPaymentHistory(dealer.id, page, limit);
  }

  @Get(':id')
  @Roles('DEALER')
  @ApiOperation({ summary: 'Get payment by ID' })
  getPaymentById(@Param('id') id: string, @CurrentUser('dealer') dealer: any) {
    return this.paymentsService.getPaymentById(id, dealer.id);
  }

  @Get(':id/invoice')
  @Roles('DEALER')
  @ApiOperation({ summary: 'Get invoice for payment' })
  getInvoice(@Param('id') id: string, @CurrentUser('dealer') dealer: any) {
    return this.paymentsService.getInvoice(id, dealer.id);
  }

  @Post('create-checkout')
  @Roles('DEALER')
  @ApiOperation({ summary: 'Create checkout session for subscription' })
  createCheckoutSession(
    @CurrentUser('dealer') dealer: any,
    @Body() data: { plan: string },
  ) {
    return this.paymentsService.createCheckoutSession(dealer.id, data.plan);
  }
}

