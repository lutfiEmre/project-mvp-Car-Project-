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
}

