import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DealersService } from './dealers.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { UpdateDealerDto } from './dto/update-dealer.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dealers')
@Controller({ path: 'dealers', version: '1' })
export class DealersController {
  constructor(private readonly dealersService: DealersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all dealers' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'verified', required: false })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('city') city?: string,
    @Query('verified') verified?: string,
  ) {
    return this.dealersService.findAll({
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 20,
      where: {
        ...(city && { city }),
        ...(verified === 'true' && { verified: true }),
      },
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current dealer profile' })
  async getMyProfile(@CurrentUser('sub') userId: string) {
    return this.dealersService.findByUserId(userId);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dealer statistics' })
  async getMyStats(@CurrentUser() user: any) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.getStats(dealer.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create dealer profile' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateDealerDto) {
    return this.dealersService.create(userId, dto);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update dealer profile' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateDealerDto,
  ) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.update(dealer.id, user.sub, dto);
  }

  @Put('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update dealer avatar' })
  async updateAvatar(
    @CurrentUser() user: any,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.update(dealer.id, user.sub, { logo: avatarUrl });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get dealer public profile' })
  async findById(@Param('id') id: string) {
    return this.dealersService.getPublicProfile(id);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify dealer (Admin only)' })
  async verify(@Param('id') id: string) {
    return this.dealersService.verify(id);
  }

  @Get('me/inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dealer inquiries' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getMyInquiries(
    @CurrentUser() user: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
  ) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.getInquiries(dealer.id, {
      skip: skip ? Number(skip) : 0,
      take: take ? Number(take) : 50,
      status,
    });
  }

  @Get('me/inquiries/:inquiryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get inquiry details' })
  async getInquiryById(
    @CurrentUser() user: any,
    @Param('inquiryId') inquiryId: string,
  ) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.getInquiryById(inquiryId, dealer.id);
  }

  @Put('me/inquiries/:inquiryId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update inquiry status and reply' })
  async updateInquiryStatus(
    @CurrentUser() user: any,
    @Param('inquiryId') inquiryId: string,
    @Body() body: { status: string; reply?: string },
  ) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.updateInquiryStatus(
      inquiryId,
      dealer.id,
      body.status,
      body.reply,
    );
  }

  @Get('me/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dealer reviews' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async getMyReviews(
    @CurrentUser() user: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    try {
      console.log(`[getMyReviews Controller] User ID: ${user.sub}`);
      const dealer = await this.dealersService.findByUserId(user.sub);
      console.log(`[getMyReviews Controller] Dealer ID: ${dealer.id}`);
      const result = await this.dealersService.getMyReviews(dealer.id, {
        skip: skip ? Number(skip) : 0,
        take: take ? Number(take) : 50,
      });
      console.log(`[getMyReviews Controller] Returning ${result.data.length} reviews`);
      return result;
    } catch (error) {
      console.error('[getMyReviews Controller] Error:', error);
      throw error;
    }
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a review for a dealer' })
  async createReview(
    @Param('id') dealerId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.dealersService.createReview(dealerId, userId, dto);
  }

  @Put('me/reviews/:reviewId/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add or update response to a review' })
  async respondToReview(
    @CurrentUser() user: any,
    @Param('reviewId') reviewId: string,
    @Body() body: { response: string },
  ) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.respondToReview(reviewId, dealer.id, body.response);
  }

  @Delete('me/reviews/:reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a review (dealer can delete reviews on their listings or their own reviews)' })
  async deleteReview(
    @CurrentUser() user: any,
    @Param('reviewId') reviewId: string,
    @Query('type') reviewType: 'dealer' | 'listing' = 'listing',
  ) {
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.dealersService.deleteReview(reviewId, reviewType, dealer.id);
  }
}

