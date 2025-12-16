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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminDashboard, usePendingListings } from '@/hooks/use-admin';
import { useMemo } from 'react';

const recentActivity = [
  {
    id: '1',
    action: 'New dealer registration',
    subject: 'Vancouver Auto Hub',
    time: '10 minutes ago',
    icon: Building2,
    color: 'text-emerald-500',
  },
  {
    id: '2',
    action: 'Listing approved',
    subject: '2024 Tesla Model Y',
    time: '25 minutes ago',
    icon: CheckCircle,
    color: 'text-blue-500',
  },
  {
    id: '3',
    action: 'User reported',
    subject: 'Suspicious listing activity',
    time: '1 hour ago',
    icon: AlertTriangle,
    color: 'text-amber-500',
  },
  {
    id: '4',
    action: 'Payment received',
    subject: 'Professional Plan - $149',
    time: '2 hours ago',
    icon: DollarSign,
    color: 'text-purple-500',
  },
];

export default function AdminDashboardPage() {
  const { data: dashboardData, isLoading: isDashboardLoading } = useAdminDashboard();
  const { data: pendingData, isLoading: isPendingLoading } = usePendingListings({ limit: 3 });

  const stats = useMemo(() => {
    const data = dashboardData || {
      totalUsers: 12453,
      totalDealers: 2584,
      totalListings: 48291,
      activeListings: 42156,
      pendingListings: 156,
      totalRevenue: 128450,
    };

    return [
      {
        name: 'Total Users',
        value: data.totalUsers?.toLocaleString() || '12,453',
        change: '+342',
        changeType: 'increase',
        icon: Users,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      },
      {
        name: 'Active Dealers',
        value: data.totalDealers?.toLocaleString() || '2,584',
        change: '+28',
        changeType: 'increase',
        icon: Building2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      },
      {
        name: 'Total Listings',
        value: data.totalListings?.toLocaleString() || '48,291',
        change: '+1,245',
        changeType: 'increase',
        icon: Car,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
      },
      {
        name: 'Monthly Revenue',
        value: `$${(data.totalRevenue || 128450).toLocaleString()}`,
        change: '+12%',
        changeType: 'increase',
        icon: DollarSign,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
      },
    ];
  }, [dashboardData]);

  const pendingApprovals = useMemo(() => {
    if (pendingData?.data && pendingData.data.length > 0) {
      return pendingData.data.map((listing: any) => ({
        id: listing.id,
        type: 'listing',
        title: listing.title,
        dealer: listing.dealer?.businessName || 'Private Seller',
        submitted: new Date(listing.createdAt).toLocaleDateString(),
      }));
    }
    return [
      {
        id: '1',
        type: 'listing',
        title: '2024 BMW M4 Competition',
        dealer: 'Premium Auto Gallery',
        submitted: '2 hours ago',
      },
      {
        id: '2',
        type: 'dealer',
        title: 'Toronto Auto World',
        dealer: 'Toronto, ON',
        submitted: '5 hours ago',
      },
      {
        id: '3',
        type: 'listing',
        title: '2023 Mercedes-Benz GLE 450',
        dealer: 'Luxury Motors',
        submitted: '1 day ago',
      },
    ];
  }, [pendingData]);

  const pendingCount = useMemo(() => {
    if (dashboardData?.pendingListings !== undefined) {
      return dashboardData.pendingListings;
    }
    if (pendingData?.meta?.total !== undefined) {
      return pendingData.meta.total;
    }
    return 0;
  }, [dashboardData, pendingData]);

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
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl ${stat.bg} p-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
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
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.name}</p>
                  </div>
                </CardContent>
              </Card>
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
              ) : (
                pendingApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4"
                  >
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
                          {item.dealer}
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
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
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
              ))}
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
