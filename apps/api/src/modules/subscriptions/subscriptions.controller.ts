import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, SubscriptionPlan } from '@prisma/client';

@ApiTags('Subscriptions')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Get available subscription plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current subscription' })
  async getCurrent(@CurrentUser() user: any) {
    return this.subscriptionsService.getActive(user.dealer?.id);
  }

  @Get('limits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subscription limits' })
  async getLimits(@CurrentUser() user: any) {
    return this.subscriptionsService.checkLimits(user.dealer?.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subscription history' })
  async getHistory(@CurrentUser() user: any) {
    return this.subscriptionsService.getHistory(user.dealer?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create subscription' })
  async create(
    @CurrentUser() user: any,
    @Body() body: { plan: SubscriptionPlan; billingCycle: 'monthly' | 'yearly' },
  ) {
    return this.subscriptionsService.create(user.dealer?.id, body.plan, body.billingCycle);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upgrade subscription' })
  async upgrade(@CurrentUser() user: any, @Body('plan') plan: SubscriptionPlan) {
    return this.subscriptionsService.upgrade(user.dealer?.id, plan);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subscriptionsService.cancel(id, user.dealer?.id);
  }
}

