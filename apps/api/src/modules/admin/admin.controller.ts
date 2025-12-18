import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('listings')
  @ApiOperation({ summary: 'Get all listings (Admin only)' })
  getAllListings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllListings(page, limit, status);
  }

  @Get('listings/pending')
  @ApiOperation({ summary: 'Get pending listings for approval' })
  getPendingListings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPendingListings(page, limit);
  }

  @Post('listings/:id/approve')
  @ApiOperation({ summary: 'Approve a listing' })
  approveListing(@Param('id') id: string) {
    return this.adminService.approveListing(id);
  }

  @Post('listings/:id/reject')
  @ApiOperation({ summary: 'Reject a listing' })
  rejectListing(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.rejectListing(id, reason);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllUsers({ page, limit, role, status });
  }

  @Put('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  updateUserStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateUserStatus(id, status);
  }

  @Get('dealers')
  @ApiOperation({ summary: 'Get all dealers' })
  getDealers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('verified') verified?: boolean,
  ) {
    return this.adminService.getAllDealers({ page, limit, verified });
  }

  @Post('dealers/:id/verify')
  @ApiOperation({ summary: 'Verify a dealer' })
  verifyDealer(@Param('id') id: string) {
    return this.adminService.verifyDealer(id);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  getSettings() {
    return this.adminService.getSystemSettings();
  }

  @Get('settings/maintenance')
  @Public()
  @ApiOperation({ summary: 'Get maintenance mode status (public)' })
  getMaintenanceMode() {
    return this.adminService.getMaintenanceMode();
  }

  @Put('settings/:key')
  @ApiOperation({ summary: 'Update a system setting' })
  updateSetting(@Param('key') key: string, @Body('value') value: any) {
    return this.adminService.updateSystemSetting(key, value);
  }

  @Get('reports/analytics')
  @ApiOperation({ summary: 'Get analytics data for reports' })
  getAnalytics(@Query('days') days?: number) {
    return this.adminService.getAnalytics(Number(days) || 30);
  }

  @Post('dealers/:id/suspend')
  @ApiOperation({ summary: 'Suspend a dealer' })
  suspendDealer(@Param('id') id: string) {
    return this.adminService.suspendDealer(id);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Delete a listing' })
  deleteListing(@Param('id') id: string) {
    return this.adminService.deleteListing(id);
  }

  @Get('dealers/:id/inquiries')
  @ApiOperation({ summary: 'Get inquiries for a specific dealer' })
  getDealerInquiries(
    @Param('id') dealerId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getDealerInquiries(dealerId, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 50,
      status,
    });
  }

  @Get('inquiries/:id')
  @ApiOperation({ summary: 'Get inquiry details' })
  getInquiryById(@Param('id') inquiryId: string) {
    return this.adminService.getInquiryById(inquiryId);
  }

  @Get('inquiries')
  @ApiOperation({ summary: 'Get all inquiries (messages log)' })
  getAllInquiries(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllInquiries({
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 50,
      status,
    });
  }

  @Get('activity-logs')
  @ApiOperation({ summary: 'Get activity logs' })
  getActivityLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
  ) {
    return this.adminService.getActivityLogs({ page, limit, action, entity });
  }

  @Get('activity/recent')
  @ApiOperation({ summary: 'Get recent activity' })
  getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit ? Number(limit) : 10);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  suspendUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('duration') duration?: number,
  ) {
    return this.adminService.suspendUser(id, reason, duration);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate a user' })
  activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Get('dealers/:id')
  @ApiOperation({ summary: 'Get dealer details' })
  getDealerById(@Param('id') id: string) {
    return this.adminService.getDealerById(id);
  }

  @Post('dealers/:id/unverify')
  @ApiOperation({ summary: 'Remove dealer verification' })
  unverifyDealer(@Param('id') id: string) {
    return this.adminService.unverifyDealer(id);
  }

  @Put('listings/:id/status')
  @ApiOperation({ summary: 'Update listing status' })
  updateListingStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateListingStatus(id, status);
  }

  @Post('listings/:id/feature')
  @ApiOperation({ summary: 'Feature or unfeature a listing' })
  featureListing(
    @Param('id') id: string,
    @Body() data: { featured: boolean; days?: number; featuredOrder?: number },
    @CurrentUser('sub') userId: string,
  ) {
    return this.adminService.featureListing(id, data.featured, data.days, data.featuredOrder, userId);
  }

  @Get('featured-requests')
  @ApiOperation({ summary: 'Get all featured listing requests' })
  getFeaturedRequests() {
    return this.adminService.getFeaturedRequests();
  }

  @Put('listings/:id/featured-order')
  @ApiOperation({ summary: 'Update featured listing order' })
  updateFeaturedOrder(
    @Param('id') id: string,
    @Body('order') order: number,
    @CurrentUser('sub') userId: string,
  ) {
    return this.adminService.updateFeaturedOrder(id, order, userId);
  }

  @Get('featured-listings')
  @ApiOperation({ summary: 'Get all featured listings' })
  getFeaturedListings() {
    return this.adminService.getFeaturedListings();
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing details' })
  getListingById(@Param('id') id: string) {
    return this.adminService.getListingById(id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  getAllPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dealerId') dealerId?: string,
  ) {
    return this.adminService.getAllPayments({ page, limit, dealerId });
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  getPlans() {
    return this.adminService.getPlans();
  }

  @Put('plans/:plan')
  @ApiOperation({ summary: 'Update subscription plan details' })
  updatePlan(
    @Param('plan') plan: string,
    @Body() data: {
      price?: number;
      maxListings?: number;
      maxPhotosPerListing?: number;
      featuredListings?: number;
      xmlImportEnabled?: boolean;
      analyticsEnabled?: boolean;
      prioritySupport?: boolean;
      description?: string;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.adminService.updatePlan(plan as any, data, userId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions' })
  getAllSubscriptions() {
    return this.adminService.getAllSubscriptions();
  }

  @Post('dealers/:dealerId/upgrade-subscription')
  @ApiOperation({ summary: 'Upgrade dealer subscription (admin only, no payment)' })
  upgradeDealerSubscription(
    @Param('dealerId') dealerId: string,
    @Body() data: { plan: string; billingCycle?: 'monthly' | 'yearly' },
    @CurrentUser('sub') userId: string,
  ) {
    return this.adminService.upgradeDealerSubscription(
      dealerId,
      null,
      data.plan as any,
      data.billingCycle || 'monthly',
      userId,
    );
  }

  @Post('users/:userId/upgrade-subscription')
  @ApiOperation({ summary: 'Upgrade user subscription (admin only, no payment)' })
  upgradeUserSubscription(
    @Param('userId') userId: string,
    @Body() data: { plan: string; billingCycle?: 'monthly' | 'yearly' },
    @CurrentUser('sub') adminUserId: string,
  ) {
    return this.adminService.upgradeDealerSubscription(
      null,
      userId,
      data.plan as any,
      data.billingCycle || 'monthly',
      adminUserId,
    );
  }

  @Post('email/test')
  @ApiOperation({ summary: 'Send test email' })
  async sendTestEmail(@Body() data: { email: string }) {
    return this.adminService.sendTestEmail(data.email);
  }
}

