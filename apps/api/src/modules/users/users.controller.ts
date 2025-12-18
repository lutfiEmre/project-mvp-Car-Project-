import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll({
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
      where: role ? { role } : undefined,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Get('me/inquiries')
  @ApiOperation({ summary: 'Get inquiries for the current user' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getInquiries(
    @CurrentUser('sub') userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
  ) {
    return this.usersService.getInquiries(userId, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
      where: { ...(status && status !== 'all' && { status }) },
    });
  }

  @Get('me/inquiries/:id')
  @ApiOperation({ summary: 'Get a specific inquiry for the current user' })
  async getInquiryById(
    @CurrentUser('sub') userId: string,
    @Param('id') inquiryId: string,
  ) {
    return this.usersService.getInquiryById(userId, inquiryId);
  }

  @Put('me/inquiries/:id/archive')
  @ApiOperation({ summary: 'Archive an inquiry (delete conversation)' })
  async archiveInquiry(
    @CurrentUser('sub') userId: string,
    @Param('id') inquiryId: string,
  ) {
    return this.usersService.archiveInquiry(userId, inquiryId);
  }

  @Put('me/inquiries/:id/read')
  @ApiOperation({ summary: 'Mark inquiry as read' })
  async markInquiryAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id') inquiryId: string,
  ) {
    return this.usersService.markInquiryAsRead(userId, inquiryId);
  }

  @Post('me/inquiries/:id/message')
  @ApiOperation({ summary: 'Send a message to an existing inquiry' })
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') inquiryId: string,
    @Body() body: { message: string },
  ) {
    return this.usersService.sendMessage(userId, inquiryId, body.message);
  }

  @Get('me/saved-listings')
  @ApiOperation({ summary: 'Get saved listings' })
  async getSavedListings(@CurrentUser('sub') userId: string) {
    return this.usersService.getSavedListings(userId);
  }

  @Post('me/saved-listings/:listingId')
  @ApiOperation({ summary: 'Save a listing' })
  async saveListing(
    @CurrentUser('sub') userId: string,
    @Param('listingId') listingId: string,
  ) {
    return this.usersService.saveListing(userId, listingId);
  }

  @Delete('me/saved-listings/:listingId')
  @ApiOperation({ summary: 'Remove a saved listing' })
  async unsaveListing(
    @CurrentUser('sub') userId: string,
    @Param('listingId') listingId: string,
  ) {
    return this.usersService.unsaveListing(userId, listingId);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Post('me/request-deletion')
  @ApiOperation({ summary: 'Request account deletion' })
  async requestAccountDeletion(
    @CurrentUser('sub') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.usersService.requestAccountDeletion(userId, body.reason);
  }

  @Put('me/avatar')
  @ApiOperation({ summary: 'Update avatar' })
  async updateAvatar(
    @CurrentUser('sub') userId: string,
    @Body() body: { avatarUrl: string },
  ) {
    return this.usersService.updateAvatar(userId, body.avatarUrl);
  }

  @Get('me/notification-settings')
  @ApiOperation({ summary: 'Get notification settings' })
  async getNotificationSettings(@CurrentUser('sub') userId: string) {
    return this.usersService.getNotificationSettings(userId);
  }

  @Put('me/notification-settings')
  @ApiOperation({ summary: 'Update notification settings' })
  async updateNotificationSettings(
    @CurrentUser('sub') userId: string,
    @Body() body: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      smsNotifications?: boolean;
      marketingEmails?: boolean;
    },
  ) {
    return this.usersService.updateNotificationSettings(userId, body);
  }

  @Public()
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get public user profile' })
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}

