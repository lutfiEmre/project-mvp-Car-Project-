'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Star, Phone, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

// Random company/office images for dealers without images (same as dealers page)
const dealerImages = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80',
  'https://images.unsplash.com/photo-1554435493-93422e8220c8?w=800&q=80',
];

// Get a random image for a dealer based on their index
const getDealerImage = (dealer: any, index: number) => {
  if (dealer.bannerImage) return dealer.bannerImage;
  if (dealer.image) return dealer.image;
  return dealerImages[index % dealerImages.length];
};

// Fallback dealers if API returns empty
const fallbackDealers = [
  {
    id: 'demo-1',
    businessName: 'Premium Auto Gallery',
    city: 'Toronto',
    province: 'Ontario',
    rating: 4.8,
    reviewCount: 234,
    totalListings: 156,
    totalSold: 320,
    verified: true,
    logo: null,
    bannerImage: null,
  },
  {
    id: 'demo-2',
    businessName: 'Pacific Motors',
    city: 'Vancouver',
    province: 'British Columbia',
    rating: 4.9,
    reviewCount: 189,
    totalListings: 98,
    totalSold: 245,
    verified: true,
    logo: null,
    bannerImage: null,
  },
  {
    id: 'demo-3',
    businessName: 'Prairie Auto Group',
    city: 'Calgary',
    province: 'Alberta',
    rating: 4.7,
    reviewCount: 156,
    totalListings: 203,
    totalSold: 412,
    verified: true,
    logo: null,
    bannerImage: null,
  },
];

export function FeaturedDealers() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  
  // Fetch real dealers from API
  const { data: dealersData, isLoading } = useQuery({
    queryKey: ['dealers', 'featured'],
    queryFn: () => api.dealers.getAll({ limit: 6 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use API dealers or fallback to demo data
  const dealers = (dealersData?.data && dealersData.data.length > 0) ? dealersData.data : fallbackDealers;

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {t('featuredDealers')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('featuredDealersSubtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dealers.map((dealer: any, index: number) => (
            <motion.div
              key={dealer.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-xl dark:border-slate-800"
            >
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-coral-500/20">
                {/* Banner image - use dealer's banner or random image */}
                <img
                  src={getDealerImage(dealer, index)}
                  alt={dealer.businessName}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Logo overlay */}
                {dealer.logo && (
                  <div className="absolute top-3 left-3 z-10">
                    <img
                      src={dealer.logo}
                      alt={`${dealer.businessName} logo`}
                      className="h-12 w-12 object-contain rounded-lg bg-white p-1.5 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {dealer.verified && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                    <CheckCircle className="h-3 w-3" />
                    {tCommon('verified')}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-xl font-bold text-white drop-shadow-lg">
                    {dealer.businessName}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-white/90">
                    <MapPin className="h-3 w-3" />
                    {dealer.city || 'Canada'}{dealer.province ? `, ${dealer.province}` : ''}
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{dealer.rating?.toFixed(1) || '4.5'}</span>
                    <span className="text-sm text-muted-foreground">({dealer.reviewCount || 0})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dealer.totalListings || 0} listings
                  </div>
                </div>
                
                {dealer.totalSold > 0 && (
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dealer.totalSold}+ vehicles sold</span>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  {dealer.contactPhone && (
                    <a href={`tel:${dealer.contactPhone}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full rounded-lg">
                        <Phone className="mr-2 h-4 w-4" />
                        {tCommon('contact')}
                      </Button>
                    </a>
                  )}
                  {!dealer.id.startsWith('demo-') ? (
                    <Link href={`/dealers/${dealer.id}`} className="flex-1">
                      <Button size="sm" className="w-full rounded-lg">
                        {tCommon('viewInventory')}
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" className="flex-1 rounded-lg" disabled>
                      Demo Dealer
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/dealers">
            <Button variant="outline" size="lg" className="rounded-xl">
              {t('viewAllDealers')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}


