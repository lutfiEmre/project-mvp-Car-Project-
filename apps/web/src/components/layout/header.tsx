'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  Globe,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Calculator,
  MapPin,
  Zap,
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
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoginModal } from '@/components/ui/login-modal';
import { useTranslations, useLocale } from 'next-intl';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

// Navigation items (translations applied in component)
const getBuyingItems = (t: any) => [
  { name: t('usedVehicles'), href: '/search?condition=USED', icon: Car },
  { name: t('newVehicles'), href: '/search?condition=NEW', icon: Zap },
  { name: t('startOnlinePurchase'), href: '/search', icon: ShoppingCart },
];

const getSellItems = (t: any) => [
  { name: t('vehicleValue'), href: '/vehicle-value', icon: DollarSign },
  { name: t('sellMyVehicle'), href: '/sell', icon: Car },
];

const getResearchItems = (t: any) => [
  { name: t('buyingPower'), href: '/buying-power', icon: Calculator },
  { name: t('loanCalculator'), href: '/loan-calculator', icon: Calculator },
  { name: t('findDealership'), href: '/dealers', icon: MapPin },
  { name: t('aboutUs'), href: '/about', icon: Building2 },
];

// Languages are now imported from config

const bodyTypes = [
  { name: 'SUV', href: '/search?bodyType=SUV' },
  { name: 'Sedan', href: '/search?bodyType=SEDAN' },
  { name: 'Truck', href: '/search?bodyType=PICKUP' },
  { name: 'Coupe', href: '/search?bodyType=COUPE' },
  { name: 'Electric', href: '/search?fuelType=ELECTRIC' },
  { name: 'Luxury', href: '/search?bodyType=LUXURY' },
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

function NavDropdown({ 
  label, 
  items, 
  isHomePage 
}: { 
  label: string; 
  items: { name: string; href: string; icon: any }[]; 
  isHomePage: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={cn(
        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isHomePage 
          ? "text-white/90 hover:bg-white/10 hover:text-white" 
          : "text-foreground/80 hover:bg-primary hover:text-primary-foreground"
      )}>
        {label}
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full pt-2 z-50"
          >
            <div className="min-w-[200px] rounded-xl border bg-popover p-2 shadow-xl">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LanguageSelector({ isHomePage }: { isHomePage: boolean }) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations('nav');

  const handleLanguageChange = (locale: Locale) => {
    // Set cookie and reload page
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(
          "gap-2 rounded-xl",
          isHomePage && "text-white hover:bg-white/10"
        )}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>{t('selectLanguage')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className={cn(
              "cursor-pointer gap-3",
              currentLocale === locale && "bg-primary/10"
            )}
          >
            <span>{localeFlags[locale]}</span>
            <span>{localeNames[locale]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBodyTypes, setShowBodyTypes] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const queryClient = useQueryClient();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');

  // Get translated nav items
  const buyingItems = getBuyingItems(t);
  const sellItems = getSellItems(t);
  const researchItems = getResearchItems(t);

  // Get saved listings for Heart icon dropdown
  const { data: savedListingsData } = useQuery<any>({
    queryKey: ['saved-listings'],
    queryFn: () => api.listings.getSaved(),
    enabled: !!user,
  });

  // Handle both array response and object with data property
  const savedListings: any[] = Array.isArray(savedListingsData) 
    ? savedListingsData 
    : (savedListingsData?.data || []);

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
          if (response.status === 404) {
            return { data: [], meta: { total: 0, skip: 0, take: 20 } };
          }
          return null;
        }
        return response.json();
      } catch (error) {
        return { data: [], meta: { total: 0, skip: 0, take: 20 } };
      }
    },
    enabled: !!user && user.role === 'USER',
    refetchInterval: 30000,
    retry: false,
  });

  const unreadCount = inquiriesData?.meta?.total || 0;

  // Get notifications for user
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.getAll({ limit: 10 }),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notificationCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.notifications.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
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

  const handleHeartClick = () => {
    if (!user) {
      setShowLoginModal(true);
    }
  };

  const handlePriceAlertClick = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      router.push('/saved');
    }
  };

  const getImageUrl = (listing: any) => {
    // Try media array first
    if (listing?.media && listing.media.length > 0) {
      const primaryImage = listing.media.find((m: any) => m.isPrimary) || listing.media[0];
      if (primaryImage?.url) return primaryImage.url;
    }
    // Try images array
    if (listing?.images && listing.images.length > 0) {
      const primaryImage = listing.images.find((m: any) => m.isPrimary) || listing.images[0];
      if (typeof primaryImage === 'string') return primaryImage;
      if (primaryImage?.url) return primaryImage.url;
    }
    // Try image property directly
    if (listing?.image) return listing.image;
    // Try thumbnail
    if (listing?.thumbnail) return listing.thumbnail;
    
    return '/placeholder-car.jpg';
  };

  return (
    <>
      <header className={cn(
        "z-50 w-full",
        isHomePage ? "absolute top-0" : "sticky top-0"
      )}>
        <div className={cn(
          isHomePage ? 'bg-transparent' : 'glass border-b'
        )}>
          <nav className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center group">
                  <div className="relative h-12 w-auto flex-shrink-0">
                    <img
                      src={isHomePage ? "/logo.svg" : "/logo4.svg"}
                      alt="DrivingAway Logo"
                      className="w-[100px] h-[50px] object-contain"
                    />
                  </div>
                </Link>

                <div className="hidden lg:flex lg:items-center lg:gap-1">
                  {/* Browse Dropdown */}
                  <div
                    className="relative"
                    onMouseEnter={() => setShowBodyTypes(true)}
                    onMouseLeave={() => setShowBodyTypes(false)}
                  >
                    <button className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isHomePage 
                        ? "text-white/90 hover:bg-white/10 hover:text-white" 
                        : "text-foreground/80 hover:bg-primary hover:text-primary-foreground"
                    )}>
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
                          className="absolute left-0 top-full pt-2 z-50"
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

                  {/* Buying Dropdown */}
                  <NavDropdown label={t('buying')} items={buyingItems} isHomePage={isHomePage} />
                  
                  {/* Sell Dropdown */}
                  <NavDropdown label={t('sell')} items={sellItems} isHomePage={isHomePage} />
                  
                  {/* Research Dropdown */}
                  <NavDropdown label={t('research')} items={researchItems} isHomePage={isHomePage} />
                </div>
              </div>

              <div className="hidden lg:flex lg:items-center lg:gap-2">
                {/* Language Selector */}
                <LanguageSelector isHomePage={isHomePage} />

                <Link href="/search">
                  <Button variant="ghost" size="icon" className={cn(
                    "rounded-xl",
                    isHomePage && "text-white hover:bg-white/10"
                  )}>
                    <Search className="h-5 w-5" />
                  </Button>
                </Link>

                {/* Price Drop Alert */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "rounded-xl relative",
                    isHomePage && "text-white hover:bg-white/10"
                  )}
                  onClick={handlePriceAlertClick}
                  title="Price Drop Alerts"
                >
                  <TrendingDown className="h-5 w-5" />
                </Button>

                {user ? (
                  <>
                    {/* Heart Icon with Saved Vehicles Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn(
                          "rounded-xl relative",
                          isHomePage && "text-white hover:bg-white/10"
                        )}>
                          <Heart className="h-5 w-5" />
                          {savedListings.length > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                              {savedListings.length > 9 ? '9+' : savedListings.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Saved Vehicles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto">
                          {savedListings.length === 0 ? (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              No saved vehicles yet
                            </div>
                          ) : (
                            <>
                              {savedListings.slice(0, 5).map((listing: any) => (
                                <DropdownMenuItem
                                  key={listing.id}
                                  className="cursor-pointer p-2"
                                  onClick={() => router.push(`/vehicles/${listing.slug || listing.id}`)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                      <img
                                        src={getImageUrl(listing)}
                                        alt={listing.title}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{listing.title}</p>
                                      <p className="text-xs text-primary font-bold">
                                        ${listing.price?.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/saved" className="w-full text-center cursor-pointer">
                            View All Saved Vehicles
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/dashboard/messages">
                      <Button variant="ghost" size="icon" className={cn(
                        "rounded-xl relative",
                        isHomePage && "text-white hover:bg-white/10"
                      )}>
                        <MessageCircle className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    </Link>

                    {/* Notifications */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn(
                          "rounded-xl relative",
                          isHomePage && "text-white hover:bg-white/10"
                        )}>
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
                                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
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

                    {/* User Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn(
                          "gap-2 rounded-xl pl-2 pr-3",
                          isHomePage && "text-white hover:bg-white/10"
                        )}>
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
                              <Link href="/saved" className="cursor-pointer">
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
                    {/* Heart icon for non-logged users */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "rounded-xl",
                        isHomePage && "text-white hover:bg-white/10"
                      )}
                      onClick={handleHeartClick}
                    >
                      <Heart className="h-5 w-5" />
                    </Button>

                    <Button 
                      variant="ghost" 
                      className={cn(
                        "rounded-xl",
                        isHomePage && "text-white hover:bg-white/10 border-white/20"
                      )}
                      onClick={() => setShowLoginModal(true)}
                    >
                      {tCommon('login')}
                    </Button>
                    <Link href="/register">
                      <Button className={cn(
                        "rounded-xl",
                        isHomePage && "bg-white text-primary hover:bg-white/90"
                      )}>
                        {tCommon('getStarted')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <button
                className={cn(
                  "lg:hidden rounded-lg p-2 hover:bg-accent",
                  isHomePage && "text-white hover:bg-white/10"
                )}
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
              className={cn(
                "lg:hidden border-b",
                isHomePage ? "bg-white/10 backdrop-blur-sm" : "glass"
              )}
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
                  {[...buyingItems, ...sellItems, ...researchItems].map((item) => (
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
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLoginModal(true);
                      }}
                    >
                      {tCommon('login')}
                    </Button>
                    <Link href="/register" className="flex-1">
                      <Button className="w-full">{tCommon('getStarted')}</Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Login Modal */}
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </>
  );
}
