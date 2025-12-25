'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Building2, MapPin, Star, Phone, Search, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDealers } from '@/hooks/use-dealer';
import { useTranslations } from 'next-intl';

// Fallback dealers
const fallbackDealers = [
  {
    id: '1',
    businessName: 'AutoMax Toronto',
    city: 'Toronto',
    province: 'Ontario',
    rating: 4.8,
    reviewCount: 234,
    totalListings: 156,
    verified: true,
    slug: 'automax-toronto',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  },
  {
    id: '2',
    businessName: 'Pacific Motors',
    city: 'Vancouver',
    province: 'British Columbia',
    rating: 4.9,
    reviewCount: 189,
    totalListings: 98,
    verified: true,
    slug: 'pacific-motors',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  },
  {
    id: '3',
    businessName: 'Prairie Auto Group',
    city: 'Calgary',
    province: 'Alberta',
    rating: 4.7,
    reviewCount: 156,
    totalListings: 203,
    verified: true,
    slug: 'prairie-auto-group',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  },
  {
    id: '4',
    businessName: 'Montreal Premium Cars',
    city: 'Montreal',
    province: 'Quebec',
    rating: 4.6,
    reviewCount: 98,
    totalListings: 87,
    verified: false,
    slug: 'montreal-premium-cars',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  },
  {
    id: '5',
    businessName: 'Ottawa Auto Exchange',
    city: 'Ottawa',
    province: 'Ontario',
    rating: 4.5,
    reviewCount: 142,
    totalListings: 124,
    verified: true,
    slug: 'ottawa-auto-exchange',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
  },
  {
    id: '6',
    businessName: 'Edmonton Motors',
    city: 'Edmonton',
    province: 'Alberta',
    rating: 4.7,
    reviewCount: 178,
    totalListings: 167,
    verified: true,
    slug: 'edmonton-motors',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
  },
];

// Random company/office images for dealers without images
const dealerImages = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
];

// Get a random image for a dealer based on their ID
const getDealerImage = (dealer: any) => {
  if (dealer.image) return dealer.image;
  const index = parseInt(dealer.id) % dealerImages.length;
  return dealerImages[index] || dealerImages[0];
};

export default function DealersPage() {
  const t = useTranslations('dealers');
  const tc = useTranslations('common');
  const [searchTerm, setSearchTerm] = useState('');
  const { data: dealersData, isLoading, isError } = useDealers({ limit: 50 });

  const dealers = useMemo(() => {
    // Use fallback dealers if API fails or returns empty data
    let items: any[] = fallbackDealers;
    
    if (dealersData?.data && Array.isArray(dealersData.data) && dealersData.data.length > 0) {
      items = dealersData.data;
    }
    
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return items.filter((dealer: any) => 
        dealer.businessName?.toLowerCase().includes(query) ||
        dealer.city?.toLowerCase().includes(query) ||
        dealer.province?.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [dealersData, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bgnew.png)' }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {t('subtitle')}
            </p>
            
            <div className="mt-8 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  className="h-14 rounded-xl bg-white pl-12 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button size="lg" variant="secondary" className="h-14 rounded-xl px-8">
                {tc('search')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dealers Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Featured Dealers</h2>
          <p className="text-muted-foreground">
            {isLoading ? '...' : t('dealersFound', { count: dealers.length })}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : dealers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold">{t('noDealers')}</p>
            <p className="text-muted-foreground mt-2">
              {t('subtitle')}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dealers.map((dealer: any, index: number) => (
              <motion.div
                key={dealer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-lg"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-coral-500/20">
                  <img
                    src={getDealerImage(dealer)}
                    alt={dealer.businessName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {dealer.verified && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white z-10">
                      <CheckCircle className="h-3 w-3" />
                      {tc('verified')}
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold">{dealer.businessName}</h3>
                  
                  <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {dealer.city}, {dealer.province}
                  </div>
                  
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{dealer.rating || 4.5}</span>
                      <span className="text-sm text-muted-foreground">({dealer.reviewCount || 0})</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dealer.totalListings || 0} {tc('listings')}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg">
                      <Phone className="mr-1 h-4 w-4" />
                      {tc('contact')}
                    </Button>
                    <Link href={`/dealers/${dealer.slug || dealer.id}`} className="flex-1">
                      <Button size="sm" className="w-full rounded-lg">
                        {tc('viewInventory')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center sm:p-12">
          <Building2 className="mx-auto h-12 w-12 text-white/80" />
          <h2 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Are You a Dealer?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Join CarHaus and reach thousands of potential buyers. List your inventory and grow your business today.
          </p>
          <Link href="/register?type=dealer">
            <Button size="lg" variant="secondary" className="mt-6 rounded-xl">
              Become a Dealer Partner
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
