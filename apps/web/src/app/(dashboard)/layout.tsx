'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  LayoutDashboard,
  ListPlus,
  Heart,
  Settings,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Loader2,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Listings', href: '/dashboard/listings', icon: Car },
  { name: 'Create Listing', href: '/dashboard/listings/new', icon: ListPlus },
  { name: 'Saved Vehicles', href: '/dashboard/saved', icon: Heart },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function NotificationsDropdown() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  const deleteAll = useMutation({
    mutationFn: () => api.notifications.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const notifications = notificationsData?.data || [];
  const count = unreadCount || 0;

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'NEW_MESSAGE':
      case 'MESSAGE_REPLY':
        return '/dashboard/messages';
      case 'NEW_INQUIRY':
        return '/dashboard/messages';
      case 'LISTING_APPROVED':
      case 'LISTING_REJECTED':
        return '/dashboard/listings';
      default:
        return '/dashboard/notifications';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => router.push('/dashboard/notifications')}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={deleteAll.isPending}
                title="Delete all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification: any) => {
                const timeAgo = new Date(notification.createdAt).toLocaleString();
                const link = getNotificationLink(notification);
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 px-3 py-2 cursor-pointer"
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead.mutate(notification.id);
                      }
                      router.push(link);
                    }}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <p className="text-sm font-medium flex-1">{notification.title || 'Notification'}</p>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
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
          <Link href="/dashboard/notifications" className="w-full text-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteAll.mutate()}
        title="Delete All Notifications?"
        message="This will permanently delete all your notifications. This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteAll.isPending}
      />
    </DropdownMenu>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && user?.role === 'DEALER') {
      router.push('/dealer/dashboard');
    }
  }, [isLoading, user?.role, router]);

  useEffect(() => {
    if (!isLoading && user?.role === 'ADMIN') {
      router.push('/admin');
    }
  }, [isLoading, user?.role, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show loading if redirecting
  if (!isLoading && (user?.role === 'DEALER' || user?.role === 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 border-r shadow-xl transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold gradient-text">
                CarHaus
              </span>
            </Link>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="space-y-2">
              {sidebarLinks.map((link, index) => {
                // Smart active detection: exact match OR starts with (but not parent routes)
                let isActive = false;
                if (pathname === link.href) {
                  isActive = true;
                } else if (pathname.startsWith(link.href + '/')) {
                  // Only active if it's a direct child, not if parent route matches
                  // e.g., /dashboard/listings should NOT activate /dashboard
                  if (link.href === '/dashboard') {
                    // Dashboard should only be active on exact match
                    isActive = false;
                  } else {
                    isActive = true;
                  }
                }
                
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group',
                        isActive
                          ? 'text-primary font-semibold bg-primary/5'
                          : 'text-muted-foreground hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      )}
                    >
                      {/* Animated active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2  -translate-y-1/2 mt-[-17px] h-8 w-1.5 rounded-full bg-primary"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      
                      {/* Icon with animation */}
                      <motion.div
                        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <link.icon className={cn(
                          "h-5 w-5 transition-colors",
                          isActive 
                            ? "text-primary" 
                            : "text-muted-foreground group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        )} />
                      </motion.div>
                      
                      <span className="flex-1">{link.name}</span>
                      
                      {/* Animated chevron */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>

          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
              <Avatar>
                <AvatarImage src={user?.avatar || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

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

