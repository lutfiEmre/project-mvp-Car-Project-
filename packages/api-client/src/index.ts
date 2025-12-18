import type {
  User,
  Dealer,
  Listing,
  Subscription,
  Payment,
  Notification,
  VehicleMake,
  PaginatedResponse,
  AuthTokens,
  LoginResponse,
  RegisterDto,
  LoginDto,
  SearchFilters,
} from '@carhaus/types';

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private readonly defaultRetries = 2;
  private readonly defaultRetryDelay = 1000; // 1 second

  constructor(baseUrl: string = 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { retries = this.defaultRetries, retryDelay = this.defaultRetryDelay, ...fetchOptions } = options;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          // Don't retry on client errors (4xx) except 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            const errorObj = new Error(error.message || error.error || `HTTP ${response.status}`) as Error & {
              response?: { data: unknown; status: number };
            };
            errorObj.response = { data: error, status: response.status };
            throw errorObj;
          }

          // Retry on server errors (5xx) and rate limits (429)
          if (attempt < retries && (response.status >= 500 || response.status === 429)) {
            await this.sleep(retryDelay * (attempt + 1)); // Exponential backoff
            continue;
          }

          const error = await response.json().catch(() => ({ message: 'An error occurred' }));
          const errorObj = new Error(error.message || error.error || `HTTP ${response.status}`) as Error & {
            response?: { data: unknown; status: number };
          };
          errorObj.response = { data: error, status: response.status };
          throw errorObj;
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;

        // Retry on network errors
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          if (attempt < retries) {
            await this.sleep(retryDelay * (attempt + 1));
            continue;
          }
          throw new Error('Unable to connect to server. Please check if the API is running.');
        }

        // Don't retry on other errors
        throw error;
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  auth = {
    login: (data: LoginDto): Promise<LoginResponse> =>
      this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    register: (data: RegisterDto): Promise<LoginResponse> =>
      this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    logout: (): Promise<void> =>
      this.request('/auth/logout', { method: 'POST' }),

    refreshToken: (): Promise<AuthTokens> =>
      this.request('/auth/refresh', { method: 'POST' }),

    me: (): Promise<User> =>
      this.request('/auth/me'),

    forgotPassword: (email: string): Promise<{ message: string }> =>
      this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

    resetPassword: (token: string, password: string): Promise<{ message: string }> =>
      this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  };

  users = {
    getProfile: (): Promise<User> =>
      this.request('/users/profile'),

    updateProfile: (data: Partial<User>): Promise<User> =>
      this.request('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),

    changePassword: (oldPassword: string, newPassword: string): Promise<{ message: string }> =>
      this.request('/users/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
  };

    dealers = {
    getAll: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Dealer>> => {
      const query = new URLSearchParams(
        Object.entries(params || {}).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      return this.request(`/dealers?${query}`);
    },

    getById: (id: string): Promise<Dealer> =>
      this.request(`/dealers/${id}`),

    getBySlug: (slug: string): Promise<Dealer> =>
      this.request(`/dealers/slug/${slug}`),

    create: (data: Partial<Dealer>): Promise<Dealer> =>
      this.request('/dealers', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: Partial<Dealer>): Promise<Dealer> =>
      this.request(`/dealers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    getListings: (id: string, params?: SearchFilters): Promise<PaginatedResponse<Listing>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/dealers/${id}/listings?${query}`);
    },
  };

  listings = {
    search: (filters?: SearchFilters): Promise<PaginatedResponse<Listing>> => {
      // Remove undefined values before creating URLSearchParams
      const cleanFilters = Object.fromEntries(
        Object.entries(filters || {}).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const query = new URLSearchParams(cleanFilters as any).toString();
      return this.request(`/listings?${query}`);
    },

    getById: (id: string): Promise<Listing> =>
      this.request(`/listings/id/${id}`),

    getBySlug: (slug: string): Promise<Listing> =>
      this.request(`/listings/${slug}`),

    getFeatured: (limit?: number): Promise<Listing[]> =>
      this.request(`/listings/featured?limit=${limit || 10}`),

    getRecent: (limit?: number): Promise<Listing[]> =>
      this.request(`/listings/recent?limit=${limit || 10}`),

    create: (data: Partial<Listing>): Promise<Listing> =>
      this.request('/listings', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: Partial<Listing>): Promise<Listing> =>
      this.request(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: string): Promise<void> =>
      this.request(`/listings/${id}`, { method: 'DELETE' }),

    publish: (id: string): Promise<Listing> =>
      this.request(`/listings/${id}/publish`, { method: 'POST' }),

    save: (id: string): Promise<{ saved: boolean }> =>
      this.request(`/listings/${id}/save`, { method: 'POST' }),

    unsave: (id: string): Promise<{ saved: boolean }> =>
      this.request(`/listings/${id}/unsave`, { method: 'POST' }),

    getSaved: (): Promise<Listing[]> =>
      this.request('/listings/saved'),

    getMyListings: (params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Listing>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/listings/my?${query}`);
    },

    requestFeatured: (id: string): Promise<{ message: string }> =>
      this.request(`/listings/${id}/request-featured`, { method: 'POST' }),
  };

  vehicleData = {
    getMakes: (popular?: boolean): Promise<VehicleMake[]> =>
      this.request(`/vehicle-data/makes${popular ? '?popular=true' : ''}`),

    getModels: (makeId: string): Promise<VehicleMake['models']> =>
      this.request(`/vehicle-data/makes/${makeId}/models`),

    getBodyTypes: (): Promise<{ value: string; label: string }[]> =>
      this.request('/vehicle-data/body-types'),

    getFuelTypes: (): Promise<{ value: string; label: string }[]> =>
      this.request('/vehicle-data/fuel-types'),

    getTransmissionTypes: (): Promise<{ value: string; label: string }[]> =>
      this.request('/vehicle-data/transmission-types'),

    getDriveTypes: (): Promise<{ value: string; label: string }[]> =>
      this.request('/vehicle-data/drive-types'),

    getYears: (): Promise<number[]> =>
      this.request('/vehicle-data/years'),
  };

  subscriptions = {
    getCurrent: (): Promise<Subscription> =>
      this.request('/subscriptions/current'),

    getPlans: (): Promise<{ plan: string; price: number; features: string[] }[]> =>
      this.request('/subscriptions/plans'),

    subscribe: (plan: string): Promise<Subscription> =>
      this.request('/subscriptions', { method: 'POST', body: JSON.stringify({ plan }) }),

    cancel: (): Promise<Subscription> =>
      this.request('/subscriptions/cancel', { method: 'POST' }),
  };

  payments = {
    getHistory: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Payment>> => {
      const cleanParams: Record<string, string> = {};
      if (params) {
        if (params.page !== undefined && params.page !== null) cleanParams.page = String(params.page);
        if (params.limit !== undefined && params.limit !== null) cleanParams.limit = String(params.limit);
      }
      const query = new URLSearchParams(cleanParams).toString();
      return this.request(`/payments?${query}`);
    },

    getInvoice: (id: string): Promise<Payment> =>
      this.request(`/payments/${id}/invoice`),

    createCheckoutSession: (plan: string, billingCycle?: 'monthly' | 'yearly'): Promise<{ sessionId: string; url: string }> =>
      this.request('/payments/create-checkout', { method: 'POST', body: JSON.stringify({ plan, billingCycle: billingCycle || 'monthly' }) }),

    cancelSubscription: (): Promise<void> =>
      this.request('/payments/cancel-subscription', { method: 'POST' }),
  };

  notifications = {
    getAll: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Notification>> => {
      const cleanParams: Record<string, string> = {};
      if (params) {
        if (params.page !== undefined && params.page !== null) cleanParams.page = String(params.page);
        if (params.limit !== undefined && params.limit !== null) cleanParams.limit = String(params.limit);
      }
      const query = new URLSearchParams(cleanParams).toString();
      return this.request(`/notifications?${query}`);
    },

    getUnreadCount: (): Promise<number> =>
      this.request('/notifications/unread-count'),

    markAsRead: (id: string): Promise<void> =>
      this.request(`/notifications/${id}/read`, { method: 'POST' }),

    markAllAsRead: (): Promise<void> =>
      this.request('/notifications/read-all', { method: 'POST' }),

    delete: (id: string): Promise<void> =>
      this.request(`/notifications/${id}`, { method: 'DELETE' }),

    deleteAll: (): Promise<void> =>
      this.request('/notifications/delete-all', { method: 'POST' }),
  };

  media = {
    upload: async (file: File, listingId?: string): Promise<{ url: string; id: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      if (listingId) formData.append('listingId', listingId);

      let lastError: Error | null = null;
      const maxRetries = 2;
      const retryDelay = 1000;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(`${this.baseUrl}/media/upload`, {
            method: 'POST',
            headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            // Don't retry on client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
              const error = await response.json().catch(() => ({ message: 'Upload failed' }));
              throw new Error(error.message || 'Upload failed');
            }

            // Retry on server errors (5xx)
            if (attempt < maxRetries && response.status >= 500) {
              await this.sleep(retryDelay * (attempt + 1));
              continue;
            }

            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.message || 'Upload failed');
          }

          return response.json();
        } catch (error) {
          lastError = error as Error;
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            if (attempt < maxRetries) {
              await this.sleep(retryDelay * (attempt + 1));
              continue;
            }
            throw new Error('Unable to connect to server. Please check if the API is running.');
          }
          throw error;
        }
      }

      throw lastError || new Error('Upload failed after retries');
    },

    uploadForListing: async (listingId: string, file: File): Promise<{ url: string; id: string }> => {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch(`${this.baseUrl}/media/listings/${listingId}/upload`, {
        method: 'POST',
        headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    },

    delete: (id: string): Promise<void> =>
      this.request(`/media/${id}`, { method: 'DELETE' }),
  };

  admin = {
    getDashboard: (): Promise<{
      totalUsers: number;
      totalDealers: number;
      totalListings: number;
      activeListings: number;
      pendingListings: number;
      totalRevenue: number;
      newUsersLast30Days: number;
      newListingsLast30Days: number;
    }> => this.request('/admin/dashboard'),

    getAllListings: (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Listing>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/admin/listings?${query}`);
    },

    getInquiries: (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<any>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/admin/inquiries?${query}`);
    },

    getPendingListings: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Listing>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/admin/listings/pending?${query}`);
    },

    approveListing: (id: string): Promise<Listing> =>
      this.request(`/admin/listings/${id}/approve`, { method: 'POST' }),

    rejectListing: (id: string, reason?: string): Promise<Listing> =>
      this.request(`/admin/listings/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

    deleteListing: (id: string): Promise<void> =>
      this.request(`/admin/listings/${id}`, { method: 'DELETE' }),

    getListingById: (id: string): Promise<Listing> =>
      this.request(`/admin/listings/${id}`),

    getUsers: (params?: { page?: number; limit?: number; role?: string; status?: string }): Promise<PaginatedResponse<User>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/admin/users?${query}`);
    },

    updateUserStatus: (id: string, status: string): Promise<User> =>
      this.request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

    getDealers: (params?: { page?: number; limit?: number; verified?: boolean }): Promise<PaginatedResponse<Dealer>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null)
      );
      const query = new URLSearchParams(
        Object.entries(cleanParams).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      return this.request(`/admin/dealers?${query}`);
    },

    getPendingDealers: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Dealer>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/admin/dealers?verified=false&${query}`);
    },

    verifyDealer: (id: string): Promise<Dealer> =>
      this.request(`/admin/dealers/${id}/verify`, { method: 'POST' }),

    suspendDealer: (id: string): Promise<Dealer> =>
      this.request(`/admin/dealers/${id}/suspend`, { method: 'POST' }),

    unverifyDealer: (id: string): Promise<Dealer> =>
      this.request(`/admin/dealers/${id}/unverify`, { method: 'POST' }),

    getDealerById: (id: string): Promise<Dealer> =>
      this.request(`/admin/dealers/${id}`),

    getUserById: (id: string): Promise<User> =>
      this.request(`/admin/users/${id}`),

    updateUserRole: (id: string, role: string): Promise<User> =>
      this.request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

    suspendUser: (id: string, reason: string, duration?: number): Promise<User> =>
      this.request(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason, duration }) }),

    activateUser: (id: string): Promise<User> =>
      this.request(`/admin/users/${id}/activate`, { method: 'POST' }),

    deleteUser: (id: string): Promise<void> =>
      this.request(`/admin/users/${id}`, { method: 'DELETE' }),

    updateListingStatus: (id: string, status: string): Promise<Listing> =>
      this.request(`/admin/listings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

    featureListing: (id: string, featured: boolean, days?: number, featuredOrder?: number): Promise<Listing> =>
      this.request(`/admin/listings/${id}/feature`, { method: 'POST', body: JSON.stringify({ featured, days, featuredOrder }) }),

    getRecentActivity: (limit?: number): Promise<any[]> =>
      this.request(`/admin/activity/recent?limit=${limit || 10}`),

    getAnalytics: (days?: number): Promise<{
      userGrowth: Array<{ date: string; users: number }>;
      listingsByCategory: Array<{ category: string; count: number }>;
      revenueOverTime: Array<{ date: string; revenue: number }>;
      topLocations: Array<{ location: string; count: number }>;
    }> => {
      const query = days ? `?days=${days}` : '';
      return this.request(`/admin/reports/analytics${query}`);
    },

    getSettings: (): Promise<Array<{ key: string; value: unknown }>> =>
      this.request('/admin/settings'),

    getMaintenanceMode: (): Promise<{ maintenanceMode: boolean; maintenanceMessage: string }> =>
      this.request('/admin/settings/maintenance'),

    updateSetting: (key: string, value: unknown): Promise<{ key: string; value: unknown }> =>
      this.request(`/admin/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),

    sendTestEmail: (email: string): Promise<{ message: string }> =>
      this.request('/admin/email/test', { method: 'POST', body: JSON.stringify({ email }) }),

    getActivityLogs: (params?: { 
      page?: number; 
      limit?: number; 
      userId?: string; 
      action?: string; 
      entity?: string; 
      startDate?: string; 
      endDate?: string;
    }): Promise<PaginatedResponse<{
      id: string;
      userId?: string;
      action: string;
      entity: string;
      entityId?: string;
      oldValues?: unknown;
      newValues?: unknown;
      ipAddress?: string;
      userAgent?: string;
      metadata?: unknown;
      createdAt: string;
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/activity-logs?${query}`);
    },

    seedActivityLogs: (): Promise<{ message: string; count: number }> =>
      this.request('/activity-logs/seed', { method: 'POST' }),

    getAllPayments: (params?: { page?: number; limit?: number; dealerId?: string }): Promise<PaginatedResponse<Payment>> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'string' || v !== ''))
      );
      const stringParams: Record<string, string> = {};
      Object.entries(cleanParams).forEach(([k, v]) => {
        stringParams[k] = String(v);
      });
      const query = new URLSearchParams(stringParams).toString();
      return this.request(`/admin/payments?${query}`);
    },

    getPlans: (): Promise<Record<string, any>> =>
      this.request('/admin/plans'),

    updatePlan: (plan: string, data: {
      price?: number;
      maxListings?: number;
      maxPhotosPerListing?: number;
      featuredListings?: number;
      xmlImportEnabled?: boolean;
      analyticsEnabled?: boolean;
      prioritySupport?: boolean;
      description?: string;
    }): Promise<any> =>
      this.request(`/admin/plans/${plan}`, { method: 'PUT', body: JSON.stringify(data) }),

    getAllSubscriptions: (): Promise<Array<any>> =>
      this.request('/admin/subscriptions'),

    upgradeDealerSubscription: (dealerId: string, plan: string, billingCycle?: 'monthly' | 'yearly'): Promise<any> =>
      this.request(`/admin/dealers/${dealerId}/upgrade-subscription`, { 
        method: 'POST', 
        body: JSON.stringify({ plan, billingCycle: billingCycle || 'monthly' }) 
      }),

    upgradeUserSubscription: (userId: string, plan: string, billingCycle?: 'monthly' | 'yearly'): Promise<any> =>
      this.request(`/admin/users/${userId}/upgrade-subscription`, { 
        method: 'POST', 
        body: JSON.stringify({ plan, billingCycle: billingCycle || 'monthly' }) 
      }),

    getFeaturedRequests: (): Promise<Array<any>> =>
      this.request('/admin/featured-requests'),

    getFeaturedListings: (): Promise<Array<any>> =>
      this.request('/admin/featured-listings'),

    updateFeaturedOrder: (listingId: string, order: number): Promise<any> =>
      this.request(`/admin/listings/${listingId}/featured-order`, {
        method: 'PUT',
        body: JSON.stringify({ order }),
      }),
  };

  reviews = {
    getDealerReviews: (dealerId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> => {
      const cleanParams: Record<string, string> = {};
      if (params) {
        if (params.page !== undefined && params.page !== null) cleanParams.page = String(params.page);
        if (params.limit !== undefined && params.limit !== null) cleanParams.limit = String(params.limit);
      }
      const query = new URLSearchParams(cleanParams).toString();
      return this.request(`/dealers/${dealerId}/reviews?${query}`);
    },

    createDealerReview: (dealerId: string, data: { rating: number; title?: string; content: string }): Promise<any> =>
      this.request(`/dealers/${dealerId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),

    createListingReview: (listingId: string, data: { rating: number; title?: string; content: string }): Promise<any> =>
      this.request(`/listings/${listingId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  };
}

export const createApiClient = (baseUrl?: string) => new ApiClient(baseUrl);
export type { ApiClient };

