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
  Patch,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { CreateListingReviewDto } from './dto/create-listing-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, ListingStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { DealersService } from '../dealers/dealers.service';

@ApiTags('Listings')
@Controller({ path: 'listings', version: '1' })
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly jwtService: JwtService,
    private readonly dealersService: DealersService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search and filter listings' })
  async findAll(@Query() query: SearchListingsDto, @Req() req?: any) {
    const user = req?.user || null;
    return this.listingsService.findAll(query, user);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured listings' })
  async getFeatured(@Query('take') take?: number) {
    return this.listingsService.getFeatured(take ? Number(take) : 8);
  }

  @Get('recent')
  @Public()
  @ApiOperation({ summary: 'Get recent listings' })
  async getRecent(@Query('take') take?: number) {
    return this.listingsService.getRecent(take ? Number(take) : 12);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user listings' })
  @ApiQuery({ name: 'status', required: false, enum: ListingStatus })
  async getMyListings(
    @CurrentUser() user: any,
    @Query('status') status?: ListingStatus,
  ) {
    return this.listingsService.getMyListings(user.sub, status, user.role);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user saved listings' })
  async getSavedListings(@CurrentUser() user: any) {
    return this.listingsService.getSavedListings(user.sub);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get listing statistics (Admin only)' })
  async getStats() {
    return this.listingsService.getStats();
  }

  @Get('id/:id')
  @Public()
  @ApiOperation({ summary: 'Get listing by ID' })
  async findById(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get listing by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.listingsService.findBySlug(slug);
  }

  @Get(':id/similar')
  @Public()
  @ApiOperation({ summary: 'Get similar listings' })
  async getSimilar(@Param('id') id: string, @Query('take') take?: number) {
    return this.listingsService.getSimilar(id, take ? Number(take) : 6);
  }

  @Get(':id/reviews')
  @Public()
  @ApiOperation({ summary: 'Get reviews for a listing' })
  async getListingReviews(@Param('id') id: string) {
    return this.listingsService.getListingReviews(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new listing' })
  async create(@CurrentUser() user: any, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.sub, dto, user.dealer?.id);
  }

  @Put(':id/reviews/:reviewId/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEALER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add or update response to a listing review' })
  async respondToListingReview(
    @Param('id') listingId: string,
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: any,
    @Body() body: { response: string },
  ) {
    // Get dealer ID from user
    const dealer = await this.dealersService.findByUserId(user.sub);
    return this.listingsService.respondToListingReview(reviewId, dealer.id, body.response);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a listing' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.sub, dto, user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update listing status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ListingStatus,
    @CurrentUser() user: any,
  ) {
    // Check ownership or admin
    const listing = await this.listingsService.findById(id);
    if (user.role !== UserRole.ADMIN && listing.userId !== user.sub) {
      throw new Error('Forbidden');
    }

    // Only admin can approve
    if (status === ListingStatus.ACTIVE && user.role !== UserRole.ADMIN) {
      // Auto approve for now (in production, this would go to PENDING_APPROVAL)
    }

    return this.listingsService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a listing' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.delete(id, user.sub, user.role);
  }

  @Post('inquiry')
  @Public()
  @ApiOperation({ summary: 'Send inquiry message to dealer about a listing' })
  async createInquiry(@Body() dto: CreateInquiryDto, @Req() req?: any) {
    // Try to get userId from token if provided
    let userId: string | undefined;
    try {
      const authHeader = req?.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Try to verify the token first (for valid tokens)
        try {
          const verified = this.jwtService.verify(token) as any;
          if (verified && verified.sub) {
            userId = verified.sub;
            console.log('Extracted userId from verified token:', userId);
          }
        } catch (verifyError) {
          // If verification fails, try decode as fallback (for expired but valid format tokens)
          // This allows users with expired tokens to still send inquiries with their userId
          const decoded = this.jwtService.decode(token) as any;
          console.log('Token verification failed, trying decode:', verifyError);
          if (decoded && decoded.sub) {
            userId = decoded.sub;
            console.log('Extracted userId from decoded token:', userId);
          }
        }
      }
    } catch (error) {
      // Token invalid or missing, continue without userId
      console.error('Error processing token:', error);
    }
    console.log('Creating inquiry with userId:', userId);

    return this.listingsService.createInquiry({
      ...dto,
      userId,
    });
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a review for a listing' })
  async createReview(
    @Param('id') listingId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateListingReviewDto,
  ) {
    return this.listingsService.createReview(listingId, userId, dto);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Save a listing to favorites' })
  async saveListing(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.saveListing(id, user.sub);
  }

  @Post(':id/unsave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove a listing from favorites' })
  async unsaveListing(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.unsaveListing(id, user.sub);
  }

  @Post(':id/request-featured')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request to feature a listing' })
  async requestFeatured(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.requestFeatured(id, user.sub);
  }
}

