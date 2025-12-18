'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Menu,
  X,
  User,
  Heart,
  Bell,
  ChevronDown,
  Building2,
  LogOut,
  Settings,
  LayoutDashboard,
  Car,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

const navigation = [
  { name: 'Buy', href: '/search' },
  { name: 'Sell', href: '/sell' },
  { name: 'Dealers', href: '/dealers' },
  { name: 'Loan Calculator', href: '/loan-calculator' },
  { name: 'About', href: '/about' },
];

const bodyTypes = [
  { 
    name: 'SUV', 
    href: '/search?bodyType=SUV',
  },
  { 
    name: 'Sedan', 
    href: '/search?bodyType=SEDAN',
  },
  { 
    name: 'Truck', 
    href: '/search?bodyType=PICKUP',
  },
  { 
    name: 'Coupe', 
    href: '/search?bodyType=COUPE',
  },
  { 
    name: 'Electric', 
    href: '/search?fuelType=ELECTRIC',
  },
  { 
    name: 'Luxury', 
    href: '/search?bodyType=LUXURY',
  },
];

interface HeaderProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBodyTypes, setShowBodyTypes] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  // Get unread inquiries count for user
  const { data: inquiriesData } = useQuery({
    queryKey: ['user', 'inquiries', 'unread'],
    queryFn: async () => {
      if (!user || user.role === 'DEALER' || user.role === 'ADMIN') return null;
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/inquiries?status=NEW`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          // Silently handle 404 - endpoint may not be available yet
          if (response.status === 404) {
            return { data: [], meta: { total: 0, skip: 0, take: 20 } };
          }
          return null;
        }
        return response.json();
      } catch (error) {
        // Silently handle network errors
        return { data: [], meta: { total: 0, skip: 0, take: 20 } };
      }
    },
    enabled: !!user && user.role === 'USER',
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false, // Don't retry on failure to avoid console spam
  });

  const unreadCount = inquiriesData?.meta?.total || 0;
  const queryClient = useQueryClient();

  // Get notifications for user
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.getAll({ limit: 10 }),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: notificationCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.notifications.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const notifications = notificationsData?.data || [];
  const unreadNotificationCount = notificationCount || 0;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b">
        <nav className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center group">
                <div className="relative h-12 w-auto flex-shrink-0">
                  <img
                    src="https://cdn.myikas.com/images/theme-images/c1ebef4d-8cba-49be-a4ec-33ea0297fc9a/image_1080.webp"
                    alt="CarHaus Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
              </Link>

              <div className="hidden lg:flex lg:items-center lg:gap-1">
                <div
                  className="relative"
                  onMouseEnter={() => setShowBodyTypes(true)}
                  onMouseLeave={() => setShowBodyTypes(false)}
                >
                  <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary hover:text-primary-foreground">
                    Browse
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      showBodyTypes && "rotate-180"
                    )} />
                  </button>
                  
                  <AnimatePresence>
                    {showBodyTypes && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-full pt-2"
                      >
                        <div className="grid w-[400px] grid-cols-3 gap-2 rounded-2xl border bg-popover p-4 shadow-xl">
                          {bodyTypes.map((type) => (
                            <Link
                              key={type.name}
                              href={type.href}
                              className="group flex items-center justify-center rounded-xl p-3 transition-all hover:scale-105 hover:bg-primary hover:shadow-md"
                            >
                              <span className="text-sm font-medium text-center group-hover:text-primary-foreground">{type.name}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex lg:items-center lg:gap-3">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              {user ? (
                <>
                  <Link href="/saved">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/messages">
                    <Button variant="ghost" size="icon" className="rounded-xl relative">
                      <MessageCircle className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl relative">
                        <Bell className="h-5 w-5" />
                        {unreadNotificationCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <h3 className="text-sm font-semibold">Notifications</h3>
                        {unreadNotificationCount > 0 && (
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
                                    if (!notification.isRead) {
                                      markAsRead.mutate(notification.id);
                                    }
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
                        <Link 
                          href={
                            user?.role === 'ADMIN' 
                              ? '/admin/notifications' 
                              : user?.role === 'DEALER' 
                              ? '/dealer/notifications' 
                              : '/dashboard/notifications'
                          } 
                          className="w-full text-center"
                        >
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 rounded-xl pl-2 pr-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={user.avatar ? `${user.avatar}${user.avatar.includes('?') ? '&' : '?'}cb=${Date.now()}` : ''} 
                            alt="Profile" 
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user.firstName}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span>{user.firstName} {user.lastName}</span>
                          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {user.role === 'ADMIN' ? (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      ) : user.role === 'DEALER' ? (
                        <DropdownMenuItem asChild>
                          <Link href="/dealer/dashboard" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dealer Dashboard
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="cursor-pointer">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/listings" className="cursor-pointer">
                              <Car className="mr-2 h-4 w-4" />
                              My Listings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/saved" className="cursor-pointer">
                              <Heart className="mr-2 h-4 w-4" />
                              Saved Vehicles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/messages" className="cursor-pointer">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Messages
                              {unreadCount > 0 && (
                                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link 
                          href={
                            user.role === 'ADMIN' 
                              ? '/admin/settings' 
                              : user.role === 'DEALER' 
                              ? '/dealer/settings' 
                              : '/dashboard/settings'
                          } 
                          className="cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="rounded-xl">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button
              className="lg:hidden rounded-lg p-2 hover:bg-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-b"
          >
            <div className="container mx-auto space-y-4 px-4 py-6">
              <div className="grid grid-cols-3 gap-2">
                {bodyTypes.map((type) => (
                  <Link
                    key={type.name}
                    href={type.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex items-center justify-center rounded-xl bg-accent/50 p-3 transition-all hover:bg-primary hover:scale-105"
                  >
                    <span className="text-sm font-medium text-center group-hover:text-primary-foreground">{type.name}</span>
                  </Link>
                ))}
              </div>
              
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {!user && (
                <div className="flex gap-3 pt-4">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

