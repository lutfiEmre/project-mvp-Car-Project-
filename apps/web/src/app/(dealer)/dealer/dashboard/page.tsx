'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Eye,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  DollarSign,
  Users,
  Star,
  Loader2,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatNumber } from '@/lib/utils';
import { useDealerInventory } from '@/hooks/use-dealer';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DealerDashboardPage() {
  const t = useTranslations('dealer');
  const queryClient = useQueryClient();
  const { data: inventoryData, isLoading } = useDealerInventory();
  const { data: paymentsData } = useQuery({
    queryKey: ['dealer', 'payments'],
    queryFn: () => api.payments.getHistory({ limit: 100 }),
  });
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.getAll({ limit: 5 }),
  });
  const { data: dealerData } = useQuery({
    queryKey: ['dealer', 'me'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch dealer');
      return response.json();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch inquiries (messages)
  const { data: inquiriesData } = useQuery({
    queryKey: ['dealer', 'inquiries'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/inquiries?take=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch reviews (both dealer and listing reviews)
  const { data: reviewsData } = useQuery({
    queryKey: ['dealer', 'reviews', 'dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/reviews?take=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async ({ reviewId, reviewType }: { reviewId: string; reviewType: 'dealer' | 'listing' }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/reviews/${reviewId}?type=${reviewType}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete review');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer', 'reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete review');
    },
  });

  // Calculate revenue for current month
  const currentMonthRevenue = useMemo(() => {
    if (!paymentsData?.data) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return paymentsData.data
      .filter((p: any) => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate >= startOfMonth && p.status === 'COMPLETED';
      })
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  }, [paymentsData]);

  // Calculate views and inquiries trends (last 7 days)
  // Deterministic algorithm: same input = same output (no random, refresh-safe)
  const viewsTrend = useMemo(() => {
    const listings = inventoryData?.data || [];
    const inquiries = inquiriesData || [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    // Deterministic views distribution algorithm
    // Uses listing ID as seed for consistent distribution across refreshes
    const listingViewsDistribution = listings.map((listing: any) => {
      const listingCreatedAt = new Date(listing.createdAt);
      listingCreatedAt.setHours(0, 0, 0, 0);
      const listingAge = Math.max(1, Math.floor((now.getTime() - listingCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
      const totalViews = listing.views || 0;
      
      if (totalViews === 0) return [];
      
      // Use listing ID as seed for deterministic distribution
      const seed = listing.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      
      const dailyViews: { date: Date; views: number }[] = [];
      
      // Calculate which days this listing was active in the last 7 days
      const activeDays = last7Days.filter(day => {
        return day >= listingCreatedAt;
      });
      
      if (activeDays.length === 0) return [];
      
      // Distribute views using weighted algorithm:
      // - Newer listings get more views in early days (exponential decay)
      // - Older listings get more evenly distributed views
      // - Deterministic based on listing ID seed
      
      let remainingViews = totalViews;
      const totalActiveDays = activeDays.length;
      
      // Calculate weights for each day (exponential decay: first day gets most)
      const weights: number[] = [];
      const decayRate = listingAge <= 7 ? 0.25 : 0.1; // Stronger decay for new listings
      
      for (let i = 0; i < totalActiveDays; i++) {
        const weight = Math.pow(1 - decayRate, i);
        weights.push(weight);
      }
      
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      // Distribute views proportionally
      for (let i = 0; i < activeDays.length; i++) {
        const dayDate = activeDays[i];
        const weight = weights[i];
        const proportion = weight / totalWeight;
        
        let dayViews: number;
        if (i === activeDays.length - 1) {
          // Last day gets remaining views to ensure total matches
          dayViews = remainingViews;
        } else {
          dayViews = Math.round(totalViews * proportion);
          remainingViews -= dayViews;
        }
        
        dailyViews.push({ date: dayDate, views: Math.max(0, dayViews) });
      }
      
      return dailyViews;
    });

    return last7Days.map(dayDate => {
      const dateStr = dayDate.toISOString().split('T')[0];
      
      // Count inquiries for this date
      const dayInquiries = inquiries.filter((inq: any) => {
        const inqDate = new Date(inq.createdAt);
        inqDate.setHours(0, 0, 0, 0);
        return inqDate.getTime() === dayDate.getTime();
      }).length;

      // Sum views from all listings for this day
      const dayViews = listingViewsDistribution.reduce((sum: number, distribution: any[]) => {
        const dayData = distribution.find((d: any) => {
          const dDateStr = d.date.toISOString().split('T')[0];
          return dDateStr === dateStr;
        });
        return sum + (dayData?.views || 0);
      }, 0);

      return {
        date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: Math.max(0, dayViews), // Ensure non-negative
        inquiries: dayInquiries,
      };
    });
  }, [inventoryData, inquiriesData]);

  // Recent activity from listings
  const recentActivity = useMemo(() => {
    const listings = inventoryData?.data || [];
    return listings
      .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 5)
      .map((listing: any) => ({
        id: listing.id,
        type: listing.status === 'ACTIVE' ? t('listingActive') : listing.status === 'PENDING_APPROVAL' ? t('pendingApproval') : t('listingUpdated'),
        title: listing.title,
        time: new Date(listing.updatedAt || listing.createdAt).toLocaleString(),
        status: listing.status,
      }));
  }, [inventoryData, t]);

  const stats = useMemo(() => {
    const listings = inventoryData?.data || [];
    const inquiries = inquiriesData || [];
    const activeCount = listings.filter((l: any) => l.status === 'ACTIVE').length;
    const totalViews = listings.reduce((sum: number, l: any) => sum + (l.views || 0), 0);
    const totalInquiries = inquiries.length;

    // Calculate changes (comparing with previous period)
    // For now, we'll use a simple calculation based on recent activity
    // In a real app, you'd compare with previous month/week data
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Recent inquiries (last 30 days)
    const recentInquiries = inquiries.filter((inq: any) => 
      new Date(inq.createdAt) >= last30Days
    ).length;
    const previousInquiries = inquiries.filter((inq: any) => {
      const inqDate = new Date(inq.createdAt);
      return inqDate >= last60Days && inqDate < last30Days;
    }).length;
    
    const inquiriesChange = previousInquiries > 0 
      ? ((recentInquiries - previousInquiries) / previousInquiries * 100).toFixed(0)
      : recentInquiries > 0 ? '100' : '0';

    // For views, approximate based on listing age
    // In real app, you'd track daily views
    const avgViewsPerListing = listings.length > 0 ? totalViews / listings.length : 0;
    const viewsChange = avgViewsPerListing > 50 ? '18' : avgViewsPerListing > 20 ? '12' : '5';

    // Active inventory change (new listings in last 30 days)
    const recentListings = listings.filter((l: any) => 
      new Date(l.createdAt) >= last30Days && l.status === 'ACTIVE'
    ).length;
    const inventoryChange = recentListings > 0 ? `+${recentListings}` : '0';

    // Revenue change (this month vs last month)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthRevenue = paymentsData?.data?.filter((p: any) => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate >= lastMonth && paymentDate <= lastMonthEnd && p.status === 'COMPLETED';
    }).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0;
    
    const revenueChange = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(0)
      : currentMonthRevenue > 0 ? '100' : '0';

    return [
      {
        name: t('activeInventory'),
        value: activeCount,
        change: inventoryChange,
        changeType: recentListings > 0 ? 'increase' : 'neutral',
        icon: Car,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      },
      {
        name: t('totalViews'),
        value: totalViews,
        change: `+${viewsChange}%`,
        changeType: 'increase',
        icon: Eye,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      },
      {
        name: t('newLeads'),
        value: totalInquiries,
        change: inquiriesChange !== '0' ? `+${inquiriesChange}%` : '0%',
        changeType: Number(inquiriesChange) > 0 ? 'increase' : 'neutral',
        icon: Users,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
      },
      {
        name: t('thisMonthRevenue'),
        value: currentMonthRevenue,
        change: revenueChange !== '0' ? `+${revenueChange}%` : '0%',
        changeType: Number(revenueChange) > 0 ? 'increase' : 'neutral',
        icon: DollarSign,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
      },
    ];
  }, [inventoryData, inquiriesData, paymentsData, currentMonthRevenue]);

  const topVehicles = useMemo(() => {
    const listings = inventoryData?.data || [];
    return listings
      .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
      .slice(0, 3)
      .map((l: any) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        views: l.views || 0,
        leads: l.inquiries || 0,
        image: l.media?.[0]?.url || '/placeholder-car.jpg',
      }));
  }, [inventoryData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('welcomeBack')} {t('dealershipOverview')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dealer/import">
            <Button variant="outline">{t('importInventory')}</Button>
          </Link>
          <Link href="/dealer/inventory/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addVehicle')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl ${stat.bg} p-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    {stat.changeType !== 'neutral' && (
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          stat.changeType === 'increase'
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {stat.change}
                        {stat.changeType === 'increase' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">
                      {stat.name === t('thisMonthRevenue')
                        ? formatPrice(stat.value) 
                        : formatNumber(stat.value)}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('viewsInquiries')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Views" />
                <Line type="monotone" dataKey="inquiries" stroke="#10b981" strokeWidth={2} name="Inquiries" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3"
                  >
                    <div className="mt-0.5">
                      {activity.status === 'ACTIVE' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : activity.status === 'PENDING_APPROVAL' ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.type}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noRecentActivity')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('recentMessages')}</CardTitle>
            <Link href="/dealer/messages">
              <Button variant="ghost" size="sm">{t('viewAll')}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inquiriesData && inquiriesData.length > 0 ? (
                inquiriesData.map((inquiry: any) => {
                  const timeAgo = (() => {
                    const now = new Date();
                    const created = new Date(inquiry.createdAt);
                    const diffMs = now.getTime() - created.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffMins < 60) return `${diffMins} ${t('minutesAgo')}`;
                    if (diffHours < 24) return `${diffHours} ${diffHours > 1 ? t('hoursAgoPlural') : t('hoursAgo')}`;
                    return `${diffDays} ${diffDays > 1 ? t('daysAgoPlural') : t('daysAgo')}`;
                  })();

                  const inquiryType = inquiry.phone ? t('phoneInquiry') : inquiry.email ? t('email') : t('message');
                  
                  return (
                    <div
                      key={inquiry.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{inquiry.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {inquiryType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {inquiry.listing?.title || inquiry.listing?.make + ' ' + inquiry.listing?.model || t('vehicleInquiry')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {timeAgo}
                        </p>
                      </div>
                      <Link href="/dealer/messages">
                        <Button size="sm">{t('respond')}</Button>
                      </Link>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noRecentMessages')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('topPerformingVehicles')}</CardTitle>
            <Link href="/dealer/analytics">
              <Button variant="ghost" size="sm">{t('viewAnalytics')}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVehicles.length > 0 ? (
                topVehicles.map((vehicle, index) => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="relative h-16 w-24 overflow-hidden rounded-lg shrink-0">
                    <img
                      src={vehicle.image}
                      alt={vehicle.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{vehicle.title}</p>
                    <p className="text-sm text-primary font-semibold">
                      {formatPrice(vehicle.price)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {formatNumber(vehicle.views)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <MessageCircle className="h-4 w-4" />
                      {vehicle.leads}
                    </div>
                  </div>
                </div>
              ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('noVehicles')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            {t('recentReviews')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const recentReviews = reviewsData || [];
            
            if (recentReviews.length === 0) {
              return (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noReviews')}</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {recentReviews.map((review: any) => (
                  <div key={review.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {review.type === 'listing' && review.listing && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {t('listingReview')}
                        </Badge>
                      )}
                      {(review.isOwnReview || review.type === 'listing') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this review?')) {
                              deleteReviewMutation.mutate({
                                reviewId: review.id,
                                reviewType: review.type,
                              });
                            }
                          }}
                          disabled={deleteReviewMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {review.title && (
                      <p className="text-sm font-medium mb-1">{review.title}</p>
                    )}
                    <p className="text-sm">
                      &quot;{review.content}&quot;
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-medium">— {review.reviewerName || 'Anonymous'}</p>
                      {review.type === 'listing' && review.listing && (
                        <Link 
                          href={`/vehicles/${review.listing.slug || review.listing.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {t('viewListing')}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {reviewsData && reviewsData.length >= 5 && (
                  <Link href="/dealer/reviews">
                    <Button variant="outline" className="w-full">
                      {t('viewAllReviews')}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
