'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Shield,
  Check,
  Star,
  ExternalLink,
  Loader2,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Car,
  MessageSquare,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice, formatMileage } from '@/lib/utils';
import { useListing } from '@/hooks/use-listings';
import { getMockVehicleBySlug, getMockVehicles } from '@/lib/mock-vehicles-store';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// All available vehicles data
const allVehicles: Record<string, any> = {
  '2024-bmw-m4-competition': {
    id: '1',
    title: '2024 BMW M4 Competition xDrive',
    slug: '2024-bmw-m4-competition',
    make: 'BMW',
    model: 'M4',
    year: 2024,
    trim: 'Competition xDrive',
    mileage: 1200,
    mileageUnit: 'km',
    price: 98900,
    currency: 'CAD',
    fuelType: 'GASOLINE',
    transmission: 'AUTOMATIC',
    driveType: 'AWD',
    bodyType: 'COUPE',
    condition: 'NEW',
    exteriorColor: 'Brooklyn Grey',
    interiorColor: 'Black/Red',
    engine: '3.0L Twin-Turbo I6',
    horsepower: 503,
    city: 'Toronto',
    province: 'Ontario',
    description: `Experience the thrill of driving with the 2024 BMW M4 Competition xDrive. This stunning coupe combines aggressive styling with exceptional performance.`,
    featured: true,
    features: ['Leather Seats', 'Heated Seats', 'Navigation System', 'Bluetooth', 'Backup Camera', 'Sunroof'],
    safetyFeatures: ['ABS Brakes', 'Airbags', 'Blind Spot Monitor', 'Collision Warning'],
    media: [
      { url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&q=80' },
      { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80' },
    ],
    dealer: { businessName: 'Premium Auto Gallery', verified: true, rating: 4.8, reviewCount: 89, city: 'Toronto', province: 'Ontario' },
  },
  '2023-mercedes-benz-gle-450': {
    id: '2',
    title: '2023 Mercedes-Benz GLE 450',
    slug: '2023-mercedes-benz-gle-450',
    make: 'Mercedes-Benz',
    model: 'GLE',
    year: 2023,
    trim: '450 4MATIC',
    mileage: 15000,
    mileageUnit: 'km',
    price: 82500,
    originalPrice: 89900,
    currency: 'CAD',
    fuelType: 'HYBRID',
    transmission: 'AUTOMATIC',
    driveType: 'AWD',
    bodyType: 'SUV',
    condition: 'CERTIFIED_PRE_OWNED',
    exteriorColor: 'Obsidian Black',
    interiorColor: 'Macchiato Beige',
    engine: '3.0L Turbo I6 + Electric Motor',
    horsepower: 362,
    city: 'Vancouver',
    province: 'British Columbia',
    description: `The 2023 Mercedes-Benz GLE 450 combines luxury and efficiency with its mild hybrid powertrain.`,
    featured: true,
    features: ['Premium Package', 'Burmester Sound', 'Panoramic Roof', 'Air Suspension'],
    safetyFeatures: ['Pre-Safe System', 'Active Brake Assist', 'Attention Assist'],
    media: [
      { url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80' },
    ],
    dealer: { businessName: 'Pacific Motors', verified: true, rating: 4.9, reviewCount: 156, city: 'Vancouver', province: 'British Columbia' },
  },
  '2024-tesla-model-y': {
    id: '3',
    title: '2024 Tesla Model Y',
    slug: '2024-tesla-model-y',
    make: 'Tesla',
    model: 'Model Y',
    year: 2024,
    trim: 'Long Range AWD',
    mileage: 500,
    mileageUnit: 'km',
    price: 67990,
    currency: 'CAD',
    fuelType: 'ELECTRIC',
    transmission: 'AUTOMATIC',
    driveType: 'AWD',
    bodyType: 'SUV',
    condition: 'NEW',
    exteriorColor: 'Pearl White',
    interiorColor: 'Black',
    engine: 'Dual Motor Electric',
    horsepower: 384,
    city: 'Calgary',
    province: 'Alberta',
    description: `The 2024 Tesla Model Y Long Range offers impressive range and performance.`,
    featured: false,
    features: ['Autopilot', '15" Touchscreen', 'Glass Roof', 'Premium Audio'],
    safetyFeatures: ['Automatic Emergency Braking', 'Lane Departure Avoidance'],
    media: [
      { url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80' },
    ],
    dealer: null,
  },
  '2023-porsche-911-carrera': {
    id: '4',
    title: '2023 Porsche 911 Carrera S',
    slug: '2023-porsche-911-carrera',
    make: 'Porsche',
    model: '911',
    year: 2023,
    trim: 'Carrera S',
    mileage: 8500,
    mileageUnit: 'km',
    price: 159900,
    currency: 'CAD',
    fuelType: 'GASOLINE',
    transmission: 'AUTOMATIC',
    driveType: 'RWD',
    bodyType: 'COUPE',
    condition: 'USED',
    exteriorColor: 'Guards Red',
    interiorColor: 'Black Leather',
    engine: '3.0L Twin-Turbo Flat-6',
    horsepower: 443,
    city: 'Montreal',
    province: 'Quebec',
    description: `Iconic Porsche 911 Carrera S in stunning Guards Red.`,
    featured: false,
    features: ['Sport Chrono Package', 'BOSE Sound', 'Sport Exhaust'],
    safetyFeatures: ['ParkAssist', 'Lane Change Assist'],
    media: [
      { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80' },
    ],
    dealer: { businessName: 'Exotic Motors Montreal', verified: true, rating: 4.9, reviewCount: 62, city: 'Montreal', province: 'Quebec' },
  },
  '2024-nissan-gt-r': {
    id: '5',
    title: '2024 Nissan GT-R Premium',
    slug: '2024-nissan-gt-r',
    make: 'Nissan',
    model: 'GT-R',
    year: 2024,
    trim: 'Premium',
    mileage: 2500,
    mileageUnit: 'km',
    price: 145000,
    currency: 'CAD',
    fuelType: 'GASOLINE',
    transmission: 'AUTOMATIC',
    driveType: 'AWD',
    bodyType: 'COUPE',
    condition: 'NEW',
    exteriorColor: 'Pearl White',
    interiorColor: 'Black',
    engine: '3.8L Twin-Turbo V6',
    horsepower: 565,
    city: 'Toronto',
    province: 'Ontario',
    description: `The legendary Nissan GT-R continues to deliver supercar performance.`,
    featured: true,
    features: ['Bose Audio', 'Titanium Exhaust', 'Carbon Fiber Trim'],
    safetyFeatures: ['Vehicle Dynamic Control', 'ABS'],
    media: [
      { url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=80' },
    ],
    dealer: { businessName: 'Performance Auto Toronto', verified: true, rating: 4.7, reviewCount: 98, city: 'Toronto', province: 'Ontario' },
  },
  '2023-nissan-370z': {
    id: '6',
    title: '2023 Nissan 370Z Sport',
    slug: '2023-nissan-370z',
    make: 'Nissan',
    model: '370Z',
    year: 2023,
    trim: 'Sport',
    mileage: 12000,
    mileageUnit: 'km',
    price: 48500,
    currency: 'CAD',
    fuelType: 'GASOLINE',
    transmission: 'MANUAL',
    driveType: 'RWD',
    bodyType: 'COUPE',
    condition: 'USED',
    exteriorColor: 'Magnetic Black',
    interiorColor: 'Black Cloth',
    engine: '3.7L V6',
    horsepower: 332,
    city: 'Vancouver',
    province: 'British Columbia',
    description: `Pure driving excitement with the Nissan 370Z Sport.`,
    featured: false,
    features: ['Sport Brakes', 'Limited Slip Differential'],
    safetyFeatures: ['ABS', 'Traction Control'],
    media: [
      { url: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=1200&q=80' },
    ],
    dealer: null,
  },
};

const makes = ['All Makes', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Porsche', 'Nissan', 'Toyota', 'Honda'];
const defaultVehicle = allVehicles['2024-bmw-m4-competition'];

// Quick Search Sidebar Component
function QuickSearchSidebar({ currentMake }: { currentMake: string }) {
  const router = useRouter();
  const t = useTranslations('vehicle');
  const tSearch = useTranslations('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('All Makes');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedMake !== 'All Makes') params.set('make', selectedMake);
    if (searchQuery) params.set('q', searchQuery);
    router.push(`/search?${params.toString()}`);
  };

  const similarVehicles = useMemo(() => {
    return Object.values(allVehicles)
      .filter((v: any) => v.make === currentMake)
      .slice(0, 3);
  }, [currentMake]);

  const otherVehicles = useMemo(() => {
    return Object.values(allVehicles)
      .filter((v: any) => v.make !== currentMake)
      .slice(0, 3);
  }, [currentMake]);

  return (
    <div className="space-y-6">
      {/* Quick Search Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-primary" />
            {t('quickSearch')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchVehicles')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Select value={selectedMake} onValueChange={setSelectedMake}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectMake')} />
            </SelectTrigger>
            <SelectContent>
              {makes.map((make) => (
                <SelectItem key={make} value={make}>{make}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="w-full gap-2" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            {tSearch('search')}
          </Button>

          <Link href="/search">
            <Button variant="outline" className="w-full mt-3 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {t('advancedFilters')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Same Make Vehicles */}
      {similarVehicles.length > 1 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                {t('moreMake', { make: currentMake })}
              </span>
              <Link href={`/search?make=${currentMake}`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  {t('viewAll')} <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {similarVehicles.slice(0, 3).map((v: any) => (
              <Link key={v.slug} href={`/vehicles/${v.slug}`}>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div className="relative h-14 w-20 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={v.media[0]?.url}
                      alt={v.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {v.year} {v.model}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(v.price)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Other Vehicles */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{t('youMayAlsoLike')}</span>
            <Link href="/search">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                {t('browseAll')} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {otherVehicles.map((v: any) => (
            <Link key={v.slug} href={`/vehicles/${v.slug}`}>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                <div className="relative h-14 w-20 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={v.media[0]?.url}
                    alt={v.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(v.price)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('quickLinks')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/search?condition=NEW" className="block">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-sm">{t('newVehicles')}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/search?condition=USED" className="block">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-sm">{t('usedVehicles')}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/search?bodyType=SUV" className="block">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-sm">{t('suvs')}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/search?fuelType=ELECTRIC" className="block">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-sm">{t('electricVehicles')}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/dealers" className="block">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-sm">{t('findDealers')}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const t = useTranslations('vehicle');
  const tCommon = useTranslations('common');
  
  const { data: apiListing, isLoading } = useListing(slug);
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mockVehicle, setMockVehicle] = useState<any>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setMessageForm(prev => ({
        ...prev,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Listen for mock vehicle updates
  useEffect(() => {
    const loadMockVehicle = () => {
      const storedVehicle = getMockVehicleBySlug(slug);
      if (storedVehicle) {
        setMockVehicle(storedVehicle);
        return;
      }
      const localVehicle = allVehicles[slug];
      if (localVehicle) {
        setMockVehicle(localVehicle);
      }
    };

    loadMockVehicle();

    // Listen for storage changes (when admin updates)
    const handleStorageChange = () => {
      loadMockVehicle();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for updates
    const interval = setInterval(() => {
      const updated = getMockVehicleBySlug(slug);
      if (updated) {
        setMockVehicle((prev: any) => {
          if (JSON.stringify(prev) !== JSON.stringify(updated)) {
            return updated;
          }
          return prev;
        });
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [slug]);

  const vehicle = useMemo(() => {
    if (apiListing) {
      // Build title from components (same as detail page display - year, make, model only, no trim)
      const title = `${apiListing.year || ''} ${apiListing.make || ''} ${apiListing.model || ''}`.trim();
      
      // Transform API data to match page structure
      return {
        ...apiListing,
        // Always build title from components (same format everywhere)
        title,
        // Engine string from engineSize and engineCylinders
        engine: apiListing.engineSize 
          ? `${apiListing.engineSize}L${apiListing.engineCylinders ? ` ${apiListing.engineCylinders}-Cylinder` : ''}`.trim()
          : null,
        // Ensure mileageUnit exists
        mileageUnit: apiListing.mileageUnit || 'km',
        // Ensure currency exists
        currency: apiListing.currency || 'CAD',
        // Ensure features and safetyFeatures are arrays
        features: Array.isArray(apiListing.features) ? apiListing.features : [],
        safetyFeatures: Array.isArray(apiListing.safetyFeatures) ? apiListing.safetyFeatures : [],
      };
    }
    // Use mock vehicle from state (allows editing)
    if (mockVehicle) return mockVehicle;
    
    // Fallback to original mock data
    const localVehicle = allVehicles[slug];
    if (localVehicle) return localVehicle;
    return defaultVehicle;
  }, [apiListing, slug, mockVehicle]);

  const images = useMemo(() => {
    if (vehicle.media && vehicle.media.length > 0) {
      return vehicle.media.map((m: any) => m.url || m).filter(Boolean);
    }
    return ['/placeholder-car.jpg'];
  }, [vehicle]);

  const features = vehicle.features || [];
  const safetyFeatures = vehicle.safetyFeatures || [];

  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  const scrollToThumbnail = (index: number) => {
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[index] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  };

  const nextImage = () => {
    const newIndex = (currentImage + 1) % images.length;
    setCurrentImage(newIndex);
    scrollToThumbnail(newIndex);
  };
  
  const prevImage = () => {
    const newIndex = (currentImage - 1 + images.length) % images.length;
    setCurrentImage(newIndex);
    scrollToThumbnail(newIndex);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImage(index);
    scrollToThumbnail(index);
  };

  const reviews = vehicle.reviews || [];

  useEffect(() => {
    const checkSaved = async () => {
      if (!isAuthenticated || !vehicle?.id) return;
      try {
        const savedData = await api.listings.getSaved();
        const found = savedData.some((listing: any) => listing.id === vehicle.id);
        setIsSaved(found);
      } catch (e) {}
    };
    checkSaved();
  }, [isAuthenticated, vehicle?.id]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/vehicles/${slug}`);
      return;
    }
    if (!vehicle?.id) return;
    
    setIsSaving(true);
    try {
      if (isSaved) {
        await api.listings.unsave(vehicle.id);
        setIsSaved(false);
        toast.success(t('removedFromSaved'));
      } else {
        await api.listings.save(vehicle.id);
        setIsSaved(true);
        toast.success(t('addedToSaved'));
      }
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
    } catch (e: any) {
      toast.error(e.message || t('failedToUpdateSaved'));
    } finally {
      setIsSaving(false);
    }
  };

  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; title?: string; content: string }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/listings/${vehicle.id}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('failedToCreateReview'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', slug] });
      setReviewForm({ rating: 5, title: '', content: '' });
      setShowReviewForm(false);
      toast.success(t('reviewSubmittedSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('failedToSubmitReview'));
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.content.trim()) {
      toast.error(t('pleaseWriteReview'));
      return;
    }
    createReviewMutation.mutate({
      rating: reviewForm.rating,
      title: reviewForm.title || undefined,
      content: reviewForm.content,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If API returns no data and no fallback, show error
  if (!apiListing && !allVehicles[slug] && !defaultVehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t('listingNotFound')}</h1>
          <p className="text-muted-foreground mb-4">{t('listingNotFoundMessage')}</p>
          <Link href="/search">
            <Button>{t('backToSearch')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">{t('home')}</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-foreground transition-colors">{t('search')}</Link>
          <span>/</span>
          <Link href={`/search?make=${vehicle.make}`} className="hover:text-foreground transition-colors">{vehicle.make}</Link>
          <span>/</span>
          <span className="text-foreground">{vehicle.model}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Left Sidebar - Quick Search */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <QuickSearchSidebar currentMake={vehicle.make} />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-black"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={images[currentImage]}
                  alt={vehicle.title}
                  fill
                  className="object-cover"
                  priority
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        i === currentImage ? 'w-6 bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                <div className="absolute left-4 top-4 flex gap-2">
                  {vehicle.featured && (
                    <Badge className="bg-coral-500 text-white">{t('featured')}</Badge>
                  )}
                  {vehicle.condition === 'CERTIFIED_PRE_OWNED' && (
                    <Badge className="bg-emerald-500 text-white">
                      <Check className="mr-1 h-3 w-3" />
                      {t('certified')}
                    </Badge>
                  )}
                  {vehicle.condition === 'NEW' && (
                    <Badge className="bg-blue-500 text-white">{t('new')}</Badge>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div 
                  ref={thumbnailsRef}
                  className="flex gap-2 p-4 overflow-x-auto scroll-smooth scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {images.map((img: string, i: number) => (
                    <motion.button
                      key={i}
                      onClick={() => handleThumbnailClick(i)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        scale: i === currentImage ? 1.05 : 1,
                        opacity: i === currentImage ? 1 : 0.7,
                      }}
                      transition={{ duration: 0.2 }}
                      className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg transition-all ${
                        i === currentImage ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-primary/50'
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Vehicle Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-display text-2xl">
                        {vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </CardTitle>
                      <p className="mt-1 text-muted-foreground">{vehicle.trim}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleToggleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart className={isSaved ? 'fill-coral-500 text-coral-500' : ''} />
                        )}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                      <Gauge className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('mileage')}</p>
                        <p className="font-semibold">{formatMileage(vehicle.mileage, vehicle.mileageUnit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                      <Fuel className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('fuel')}</p>
                        <p className="font-semibold capitalize">{vehicle.fuelType?.toLowerCase().replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                      <Settings2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('transmission')}</p>
                        <p className="font-semibold capitalize">{vehicle.transmission?.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('year')}</p>
                        <p className="font-semibold">{vehicle.year}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
                <TabsTrigger value="features">{t('features')}</TabsTrigger>
                <TabsTrigger value="specs">{t('specifications')}</TabsTrigger>
                <TabsTrigger value="reviews">
                  {t('reviews')} {reviews.length > 0 && `(${reviews.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('vehicleDescription')}</CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: (vehicle.description || '')
                          .replace(/<hr><\/hr>/gi, '<hr />')
                          .replace(/<hr><\/hr>/gi, '<hr />')
                          .replace(/<br\/>/gi, '<br />')
                          .replace(/<br>/gi, '<br />')
                      }}
                      className="whitespace-pre-wrap"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        {t('features')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {features.length > 0 ? (
                        <ul className="grid grid-cols-2 gap-2">
                          {features.map((feature: string) => (
                            <li key={feature} className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">{t('noFeaturesListed')}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-500" />
                        {t('safetyFeatures')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {safetyFeatures.length > 0 ? (
                        <ul className="space-y-2">
                          {safetyFeatures.map((feature: string) => (
                            <li key={feature} className="flex items-center gap-2 text-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">{t('noSafetyFeaturesListed')}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { label: t('bodyType'), value: vehicle.bodyType?.replace('_', ' ') },
                        { label: t('driveType'), value: vehicle.driveType },
                        { label: t('engine'), value: vehicle.engine },
                        { label: t('horsepower'), value: vehicle.horsepower ? `${vehicle.horsepower} hp` : 'N/A' },
                        { label: t('exteriorColor'), value: vehicle.exteriorColor },
                        { label: t('interiorColor'), value: vehicle.interiorColor },
                        { label: t('condition'), value: vehicle.condition?.replace('_', ' ') },
                        { label: t('location'), value: `${vehicle.city}, ${vehicle.province}` },
                      ].map((spec) => (
                        <div key={spec.label} className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">{spec.label}</span>
                          <span className="font-medium capitalize">{spec.value?.toLowerCase() || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  {/* Review Form Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{t('reviews')} ({reviews.length})</h3>
                    {!showReviewForm && (
                      <Button
                        onClick={() => {
                          if (!isAuthenticated) {
                            router.push(`/login?redirect=/vehicles/${slug}`);
                            return;
                          }
                          setShowReviewForm(true);
                        }}
                        variant="outline"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {t('writeReview')}
                      </Button>
                    )}
                  </div>

                  {/* Review Form */}
                  {showReviewForm && (
                    <Card>
                      <CardContent className="p-6">
                        {!isAuthenticated ? (
                          <div className="text-center py-8">
                            <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">{t('loginRequired')}</h3>
                            <p className="text-muted-foreground mb-4">
                              {t('loginToReview')}
                            </p>
                            <div className="flex gap-3 justify-center">
                              <Button onClick={() => router.push(`/login?redirect=/vehicles/${slug}`)}>
                                <LogIn className="mr-2 h-4 w-4" />
                                {tCommon('login')}
                              </Button>
                              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                                {tCommon('cancel')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                              <Label>{t('rating')}</Label>
                              <div className="flex gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                                    className="focus:outline-none"
                                  >
                                    <Star
                                      className={`h-6 w-6 transition-colors ${
                                        rating <= reviewForm.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300 hover:text-yellow-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="review-title">{t('titleOptional')}</Label>
                              <Input
                                id="review-title"
                                value={reviewForm.title}
                                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                                placeholder={t('reviewTitle')}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="review-content">{t('review')}</Label>
                              <Textarea
                                id="review-content"
                                value={reviewForm.content}
                                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                                placeholder={t('shareExperience')}
                                className="mt-2 min-h-[120px]"
                                required
                              />
                            </div>

                            <div className="flex gap-3">
                              <Button
                                type="submit"
                                disabled={createReviewMutation.isPending}
                              >
                                {createReviewMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('submitting')}
                                  </>
                                ) : (
                                  t('submitReview')
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowReviewForm(false);
                                  setReviewForm({ rating: 5, title: '', content: '' });
                                }}
                              >
                                {tCommon('cancel')}
                              </Button>
                            </div>
                          </form>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{t('noReviewsYet')}</h3>
                        <p className="text-muted-foreground">
                          {t('beFirstToReview')}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{review.reviewerName || t('anonymous')}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.createdAt && (
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {review.title && (
                              <h4 className="font-medium mt-2 mb-1">{review.title}</h4>
                            )}
                            {review.content && (
                              <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{review.content}</p>
                            )}
                            
                            {/* Dealer Response */}
                            {review.dealerResponse && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">{t('dealerResponse')}</span>
                                  {review.dealerResponseAt && (
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {new Date(review.dealerResponseAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <div className="rounded-lg bg-primary/5 p-4">
                                  <p className="text-sm whitespace-pre-wrap">{review.dealerResponse}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Pricing & Contact */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold font-display text-primary">
                      {formatPrice(vehicle.price)}
                    </p>
                    {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(vehicle.originalPrice)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{t('taxesAndLicensing')}</p>
                  </div>

                  <div className="space-y-3">
                    {vehicle.dealer?.contactPhone && (
                      <Button className="w-full gap-2" size="lg" asChild>
                        <a href={`tel:${vehicle.dealer.contactPhone}`}>
                          <Phone className="h-5 w-5" />
                          {t('callDealer')}
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full gap-2" 
                      size="lg"
                      onClick={() => setMessageDialogOpen(true)}
                    >
                      <MessageCircle className="h-5 w-5" />
                      {t('sendMessage')}
                    </Button>
                    {vehicle.dealer?.contactEmail && (
                      <Button variant="outline" className="w-full gap-2" size="lg" asChild>
                        <a href={`mailto:${vehicle.dealer.contactEmail}`}>
                          <Mail className="h-5 w-5" />
                          {t('emailDealer')}
                        </a>
                      </Button>
                    )}
                    {vehicle.user && !vehicle.dealer && (
                      <Button variant="outline" className="w-full gap-2" size="lg">
                        <MessageCircle className="h-5 w-5" />
                        {t('contactSeller')}
                      </Button>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {vehicle.dealer ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={vehicle.dealer.logo || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {vehicle.dealer.businessName?.substring(0, 2).toUpperCase() || 'DL'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{vehicle.dealer.businessName}</p>
                          {vehicle.dealer.verified && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 text-emerald-500" />
                              {t('verifiedDealer')}
                            </div>
                          )}
                        </div>
                      </div>

                      {vehicle.dealer.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(vehicle.dealer.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{vehicle.dealer.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({vehicle.dealer.reviewCount} {t('reviewsCount')})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {vehicle.dealer.city}, {vehicle.dealer.province}
                      </div>

                      <Link href={`/dealers/${vehicle.dealer.id || 'dealer'}`}>
                        <Button variant="ghost" className="w-full gap-2">
                          {t('viewDealerProfile')}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : vehicle.user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={vehicle.user.avatar || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {vehicle.user.firstName?.substring(0, 1).toUpperCase() || 'U'}
                            {vehicle.user.lastName?.substring(0, 1).toUpperCase() || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">
                            {vehicle.user.firstName} {vehicle.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{t('privateSeller')}</p>
                        </div>
                      </div>
                      <Link href={`/users/${vehicle.user.id}`}>
                        <Button variant="ghost" className="w-full gap-2">
                          {t('viewUserProfile')}
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p className="font-medium">{t('privateSeller')}</p>
                      <p className="text-sm mt-1">{t('contactForInfo')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('sendMessageToDealer')}</DialogTitle>
            <DialogDescription>
              {t('sendMessageTo', { name: vehicle.dealer?.businessName || vehicle.user?.firstName || '' })}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                // Call API to send message
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                const token = user ? localStorage.getItem('accessToken') : undefined;
                const headers: HeadersInit = {
                  'Content-Type': 'application/json',
                };
                if (token) {
                  headers['Authorization'] = `Bearer ${token}`;
                }
                
                const response = await fetch(`${apiBaseUrl}/listings/inquiry`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    listingId: vehicle.id,
                    dealerId: vehicle.dealer?.id,
                    name: messageForm.name,
                    email: messageForm.email,
                    phone: messageForm.phone,
                    message: messageForm.message,
                  }),
                });
                
                if (response.ok) {
                  // Invalidate queries to refresh messages
                  if (user) {
                    queryClient.invalidateQueries({ queryKey: ['user', 'inquiries'] });
                    queryClient.invalidateQueries({ queryKey: ['user', 'inquiries', 'unread'] });
                  }
                  toast.success(t('messageSentSuccess'));
                  setMessageDialogOpen(false);
                  setMessageForm({ name: '', email: '', phone: '', message: '' });
                } else {
                  const errorData = await response.json().catch(() => ({}));
                  toast.error(errorData.message || t('failedToSendMessage'));
                }
              } catch (error) {
                console.error('Error sending message:', error);
                toast.error(t('failedToSendMessage'));
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')} *</Label>
              <Input
                id="name"
                value={messageForm.name}
                onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                required
                placeholder={t('yourName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon('email')} *</Label>
              <Input
                id="email"
                type="email"
                value={messageForm.email}
                onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                required
                placeholder={t('yourEmail')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={messageForm.phone}
                onChange={(e) => setMessageForm({ ...messageForm, phone: e.target.value })}
                placeholder={t('phonePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t('message')} *</Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                required
                placeholder={t('messagePlaceholder')}
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMessageDialogOpen(false)}
                disabled={isSubmitting}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  t('sendMessage')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
