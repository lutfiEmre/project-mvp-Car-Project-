'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  Car,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Settings,
  UserPlus,
  Shield,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminDashboard, usePendingListings } from '@/hooks/use-admin';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const { data: dashboardData, isLoading: isDashboardLoading } = useAdminDashboard();
  const { data: pendingData, isLoading: isPendingLoading } = usePendingListings({ limit: 3 });
  
  const { data: recentActivityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['admin', 'recent-activity'],
    queryFn: () => api.admin.getRecentActivity(10),
    staleTime: 1000 * 30,
  });

  const { data: pendingDealersData } = useQuery({
    queryKey: ['admin', 'pending-dealers'],
    queryFn: () => api.admin.getPendingDealers({ limit: 5 }),
    staleTime: 1000 * 60,
  });

  const stats = useMemo(() => {
    const data = dashboardData || {
      totalUsers: 0,
      totalDealers: 0,
      totalListings: 0,
      activeListings: 0,
      pendingListings: 0,
      totalRevenue: 0,
      newUsersLast30Days: 0,
      newListingsLast30Days: 0,
    };

    return [
      {
        name: 'Total Users',
        value: data.totalUsers?.toLocaleString() || '0',
        change: `+${data.newUsersLast30Days || 0}`,
        changeType: 'increase',
        icon: Users,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        href: '/admin/users',
      },
      {
        name: 'Active Dealers',
        value: data.totalDealers?.toLocaleString() || '0',
        change: `${pendingDealersData?.meta?.total || 0} pending`,
        changeType: 'neutral',
        icon: Building2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        href: '/admin/dealers',
      },
      {
        name: 'Total Listings',
        value: data.totalListings?.toLocaleString() || '0',
        change: `+${data.newListingsLast30Days || 0}`,
        changeType: 'increase',
        icon: Car,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        href: '/admin/listings',
      },
      {
        name: 'Monthly Revenue',
        value: `$${(data.totalRevenue || 0).toLocaleString()}`,
        change: '+12%',
        changeType: 'increase',
        icon: DollarSign,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        href: '/admin/reports',
      },
    ];
  }, [dashboardData, pendingDealersData]);

  const pendingApprovals = useMemo(() => {
    const items: any[] = [];
    
    if (pendingData?.data && pendingData.data.length > 0) {
      pendingData.data.forEach((listing: any) => {
        items.push({
          id: listing.id,
          type: 'listing',
          title: listing.title || `${listing.year} ${listing.make} ${listing.model}`,
          subtitle: listing.dealer?.businessName || `${listing.user?.firstName} ${listing.user?.lastName}` || 'Private Seller',
          submitted: formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }),
          href: `/admin/approvals?id=${listing.id}`,
        });
      });
    }

    if (pendingDealersData?.data && pendingDealersData.data.length > 0) {
      pendingDealersData.data.slice(0, 2).forEach((dealer: any) => {
        items.push({
          id: dealer.id,
          type: 'dealer',
          title: dealer.businessName,
          subtitle: `${dealer.city}, ${dealer.province}`,
          submitted: formatDistanceToNow(new Date(dealer.createdAt), { addSuffix: true }),
          href: `/admin/dealers?id=${dealer.id}`,
        });
      });
    }

    return items.slice(0, 5);
  }, [pendingData, pendingDealersData]);

  const pendingCount = useMemo(() => {
    const listingCount = dashboardData?.pendingListings || pendingData?.meta?.total || 0;
    const dealerCount = pendingDealersData?.meta?.total || 0;
    return listingCount + dealerCount;
  }, [dashboardData, pendingData, pendingDealersData]);

  const recentActivity = useMemo(() => {
    if (!recentActivityData || recentActivityData.length === 0) {
      return [];
    }

    return recentActivityData.map((log: any) => {
      let icon = CheckCircle;
      let color = 'text-blue-500';
      let action = log.action;

      switch (log.action) {
        case 'USER_CREATED':
        case 'USER_REGISTERED':
          icon = UserPlus;
          color = 'text-emerald-500';
          action = 'New user registration';
          break;
        case 'DEALER_CREATED':
        case 'DEALER_REGISTERED':
          icon = Building2;
          color = 'text-emerald-500';
          action = 'New dealer registration';
          break;
        case 'LISTING_CREATED':
          icon = Car;
          color = 'text-blue-500';
          action = 'New listing created';
          break;
        case 'LISTING_APPROVED':
          icon = CheckCircle;
          color = 'text-emerald-500';
          action = 'Listing approved';
          break;
        case 'LISTING_REJECTED':
          icon = XCircle;
          color = 'text-rose-500';
          action = 'Listing rejected';
          break;
        case 'USER_SUSPENDED':
          icon = AlertTriangle;
          color = 'text-amber-500';
          action = 'User suspended';
          break;
        case 'DEALER_VERIFIED':
          icon = Shield;
          color = 'text-emerald-500';
          action = 'Dealer verified';
          break;
        case 'PAYMENT_RECEIVED':
          icon = DollarSign;
          color = 'text-purple-500';
          action = 'Payment received';
          break;
        default:
          action = log.action.replace(/_/g, ' ').toLowerCase();
      }

      const subject = log.metadata?.title || 
        log.metadata?.name || 
        log.metadata?.businessName ||
        (log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System');

      return {
        id: log.id,
        action,
        subject,
        time: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }),
        icon,
        color,
      };
    });
  }, [recentActivityData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and management
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/approvals">
            <Button variant="outline" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingCount})
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button className="gap-2">
              <TrendingUp className="h-4 w-4" />
              View Reports
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isDashboardLoading ? (
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
              <Link href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className={`rounded-xl ${stat.bg} p-3`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          stat.changeType === 'increase'
                            ? 'text-emerald-500'
                            : stat.changeType === 'decrease'
                            ? 'text-rose-500'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {stat.change}
                        {stat.changeType === 'increase' && <ArrowUpRight className="h-4 w-4" />}
                        {stat.changeType === 'decrease' && <ArrowDownRight className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.name}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Approvals
            </CardTitle>
            <Link href="/admin/approvals">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isPendingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                  <p>All caught up! No pending approvals.</p>
                </div>
              ) : (
                pendingApprovals.map((item) => (
                  <Link key={item.id} href={item.href}>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          item.type === 'dealer' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                        }`}>
                          {item.type === 'dealer' ? (
                            <Building2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Car className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {item.submitted}
                        </span>
                        <Button size="sm" variant="outline">Review</Button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/admin/logs">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isActivityLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.subject}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/users">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Manage Users</span>
              </div>
            </Link>
            <Link href="/admin/dealers">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Manage Dealers</span>
              </div>
            </Link>
            <Link href="/admin/listings">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Car className="h-5 w-5 text-primary" />
                <span className="font-medium">All Listings</span>
              </div>
            </Link>
            <Link href="/admin/settings">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Settings className="h-5 w-5 text-primary" />
                <span className="font-medium">System Settings</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
