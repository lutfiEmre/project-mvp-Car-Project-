'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Car,
  LayoutDashboard,
  ListPlus,
  FileUp,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Building2,
  Users,
  Star,
  Loader2,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const sidebarLinks = [
  { name: 'Dashboard', href: '/dealer/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/dealer/inventory', icon: Car },
  { name: 'Add Vehicle', href: '/dealer/inventory/new', icon: ListPlus },
  { name: 'Import', href: '/dealer/import', icon: FileUp },
  { name: 'Analytics', href: '/dealer/analytics', icon: BarChart3 },
  { name: 'Reviews', href: '/dealer/reviews', icon: Star },
  { name: 'Messages', href: '/dealer/messages', icon: MessageCircle },
  { name: 'Notifications', href: '/dealer/notifications', icon: Bell },
  { name: 'Billing', href: '/dealer/billing', icon: CreditCard },
  { name: 'Settings', href: '/dealer/settings', icon: Settings },
];

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch dealer data for reviews count (MUST be before any conditional returns)
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
    enabled: isAuthenticated && user?.role === 'DEALER',
  });

  const reviewsCount = dealerData?._count?.reviews || 0;
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'DL';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-400">Loading dealer panel...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check if user is dealer
  if (user?.role !== 'DEALER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Dealer Access Required</h1>
          <p className="text-slate-400 mb-6">
            This area is restricted to registered dealers only. 
            If you're a dealer, please register as a dealer account.
          </p>
          <div className="space-x-4">
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
            <Button onClick={() => router.push('/register?type=dealer')} className="bg-primary">
              Register as Dealer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function NotificationsDropdown() {
    const { data: notificationsData } = useQuery({
      queryKey: ['notifications'],
      queryFn: () => api.notifications.getAll({ limit: 10 }),
    });
    const { data: unreadCount } = useQuery({
      queryKey: ['notifications', 'unread-count'],
      queryFn: () => api.notifications.getUnreadCount(),
    });
    const queryClient = useQueryClient();
    const markAsRead = useMutation({
      mutationFn: (id: string) => api.notifications.markAsRead(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
    const markAllAsRead = useMutation({
      mutationFn: () => api.notifications.markAllAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });

    const notifications = notificationsData?.data || [];
    const count = unreadCount || 0;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                Mark all as read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((notification: any) => {
                  const timeAgo = new Date(notification.createdAt).toLocaleString();
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 px-3 py-2 cursor-pointer"
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead.mutate(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <p className="text-sm font-medium flex-1">{notification.title || 'Notification'}</p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-coral-500 shrink-0 mt-1" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {timeAgo}
                      </p>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dealer/notifications" className="w-full text-center">
              View all notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <Link href="/dealer/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-coral-500">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-display text-lg font-bold">CarHaus</span>
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Dealer
                </Badge>
              </div>
            </Link>
            <button
              className="lg:hidden text-slate-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                const showBadge = link.name === 'Reviews' && reviewsCount > 0;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                    {showBadge && (
                      <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-primary/30">
                        {reviewsCount}
                      </Badge>
                    )}
                    {isActive && !showBadge && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-xl bg-gradient-to-br from-primary/20 to-coral-500/20 p-4">
              <h4 className="font-semibold text-white">Professional Plan</h4>
              <p className="mt-1 text-sm text-slate-400">
                45 of 100 listings used
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-700">
                <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-primary to-coral-500" />
              </div>
              <Link href="/dealer/billing">
                <Button size="sm" variant="secondary" className="mt-4 w-full">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
              <Avatar>
                <AvatarImage src={user?.avatar || ''} />
                <AvatarFallback className="bg-primary text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 text-slate-400 hover:text-white"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur dark:bg-slate-800/95 px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <NotificationsDropdown />
        </header>

        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

