export type UserRole = 'USER' | 'DEALER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  province?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  dealer?: Dealer;
  createdAt: string;
  updatedAt: string;
}

export interface Dealer {
  id: string;
  userId: string;
  businessName: string;
  businessLicense?: string;
  taxNumber?: string;
  description?: string;
  website?: string;
  logo?: string;
  bannerImage?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  businessHours?: Record<string, { open: string; close: string }>;
  contactEmail?: string;
  contactPhone?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  verified: boolean;
  verifiedAt?: string;
  totalListings: number;
  totalSold: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ListingStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REJECTED';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUG_IN_HYBRID' | 'NATURAL_GAS' | 'HYDROGEN';
export type TransmissionType = 'AUTOMATIC' | 'MANUAL' | 'CVT' | 'DCT' | 'SEMI_AUTOMATIC';
export type DriveType = 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD';
export type BodyType = 'SEDAN' | 'SUV' | 'COUPE' | 'CONVERTIBLE' | 'HATCHBACK' | 'WAGON' | 'PICKUP' | 'VAN' | 'MINIVAN' | 'CROSSOVER' | 'SPORTS_CAR' | 'LUXURY' | 'OTHER';
export type Condition = 'NEW' | 'USED' | 'CERTIFIED_PRE_OWNED';

export interface Listing {
  id: string;
  userId: string;
  dealerId?: string;
  title: string;
  slug: string;
  description?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  vin?: string;
  stockNumber?: string;
  mileage: number;
  mileageUnit: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  driveType: DriveType;
  bodyType: BodyType;
  condition: Condition;
  engineSize?: number;
  engineCylinders?: number;
  horsepower?: number;
  torque?: number;
  fuelEconomy?: { city: number; highway: number; combined: number };
  exteriorColor?: string;
  interiorColor?: string;
  doors?: number;
  seats?: number;
  price: number;
  originalPrice?: number;
  currency: string;
  priceNegotiable: boolean;
  features: string[];
  safetyFeatures: string[];
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  status: ListingStatus;
  featured: boolean;
  featuredUntil?: string;
  views: number;
  saves: number;
  inquiries: number;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  expiresAt?: string;
  soldAt?: string;
  createdAt: string;
  updatedAt: string;
  media?: MediaFile[];
  dealer?: Dealer;
  user?: User;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface MediaFile {
  id: string;
  listingId?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  order: number;
  isPrimary: boolean;
  alt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';

export interface Subscription {
  id: string;
  dealerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  maxListings: number;
  maxPhotosPerListing: number;
  featuredListings: number;
  xmlImportEnabled: boolean;
  analyticsEnabled: boolean;
  prioritySupport: boolean;
  price: number;
  currency: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  dealerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  invoiceNumber?: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface VehicleMake {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  country?: string;
  isPopular: boolean;
  models?: VehicleModel[];
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  bodyTypes: BodyType[];
  yearStart?: number;
  yearEnd?: number;
  isPopular: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'USER' | 'DEALER';
  dealer?: {
    businessName: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface SearchFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  bodyType?: BodyType;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  driveType?: DriveType;
  condition?: Condition;
  city?: string;
  province?: string;
  features?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'newest';
  page?: number;
  limit?: number;
}
