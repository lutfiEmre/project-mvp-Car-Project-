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

