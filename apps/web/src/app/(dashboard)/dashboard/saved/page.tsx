'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Heart, 
  Trash2, 
  MapPin, 
  Fuel, 
  Gauge, 
  Calendar,
  ExternalLink,
  Search,
  Loader2,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatPrice, formatMileage } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function SavedVehiclesPage() {
  const t = useTranslations('dashboard');
  const ts = useTranslations('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const queryClient = useQueryClient();

  const { data: savedData, isLoading } = useQuery({
    queryKey: ['listings', 'saved'],
    queryFn: async () => {
      const data = await api.listings.getSaved();
      return Array.isArray(data) ? data : [];
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.unsave(listingId),
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: ['listings', 'saved'] });
      const previousData = queryClient.getQueryData(['listings', 'saved']);
      
      queryClient.setQueryData(['listings', 'saved'], (old: any) => {
        if (!old) return old;
        return old.filter((listing: any) => listing.id !== listingId);
      });
      
      return { previousData };
    },
    onError: (error: any, listingId, context) => {
      queryClient.setQueryData(['listings', 'saved'], context?.previousData);
      toast.error(error.message || t('failedToRemove'));
    },
    onSuccess: () => {
      toast.success(t('vehicleRemoved'));
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
    },
  });

  const savedListings = savedData || [];

  const filteredVehicles = savedListings
    .filter((listing: any) => {
      if (!listing) return false;
      const title = listing.title || `${listing.year} ${listing.make} ${listing.model}`;
      return title.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'price-low':
          return (a?.price || 0) - (b?.price || 0);
        case 'price-high':
          return (b?.price || 0) - (a?.price || 0);
        case 'year':
          return (b?.year || 0) - (a?.year || 0);
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">{t('savedVehicles')}</h1>
        <p className="text-muted-foreground">
          {t('savedVehiclesSubtitle')}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchSavedVehicles')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('recentlySaved')}</SelectItem>
              <SelectItem value="price-low">{t('priceLowHigh')}</SelectItem>
              <SelectItem value="price-high">{t('priceHighLow')}</SelectItem>
              <SelectItem value="year">{t('newestYear')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-12 text-center"
        >
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-display text-lg font-semibold">
            {t('noSavedVehicles')}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {t('startBrowsing')}
          </p>
          <Link href="/search">
            <Button className="mt-6">{t('browseVehicles')}</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((listing: any, index: number) => {
            if (!listing) return null;
            
            const title = listing.title || `${listing.year} ${listing.make} ${listing.model}`;
            const firstMedia = listing.media?.[0];
            const imageUrl = firstMedia?.url || 
              (typeof firstMedia === 'string' ? firstMedia : '/placeholder-car.jpg');
            const location = [listing.city, listing.province].filter(Boolean).join(', ');
            
            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-car.jpg';
                    }}
                  />
                  <button
                    onClick={() => unsaveMutation.mutate(listing.id)}
                    disabled={unsaveMutation.isPending}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition-all hover:bg-red-50 hover:scale-110 disabled:opacity-50"
                  >
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/vehicles/${listing.slug || listing.id}`}>
                        <h3 className="font-display font-semibold hover:text-primary transition-colors">
                          {title}
                        </h3>
                      </Link>
                      <p className="text-xl font-bold text-primary mt-1">
                        {formatPrice(listing.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {location}
                      </div>
                    )}
                    {listing.mileage && (
                      <div className="flex items-center gap-1">
                        <Gauge className="h-4 w-4" />
                        {formatMileage(listing.mileage, listing.mileageUnit || 'km')}
                      </div>
                    )}
                    {listing.fuelType && (
                      <div className="flex items-center gap-1">
                        <Fuel className="h-4 w-4" />
                        {listing.fuelType.replace('_', ' ')}
                      </div>
                    )}
                    {listing.year && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {listing.year}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/vehicles/${listing.slug || listing.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {t('viewDetails')}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => unsaveMutation.mutate(listing.id)}
                      disabled={unsaveMutation.isPending}
                    >
                      {unsaveMutation.isPending && unsaveMutation.variables === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
