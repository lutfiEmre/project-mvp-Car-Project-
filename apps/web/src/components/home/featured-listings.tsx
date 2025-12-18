'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { useFeaturedListings } from '@/hooks/use-listings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import type { Listing } from '@carhaus/types';

// Fallback data when API is unavailable
const fallbackListings: Listing[] = [
  {
    id: '1',
    userId: '1',
    title: '2024 BMW M4 Competition',
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
    city: 'Toronto',
    province: 'Ontario',
    country: 'Canada',
    status: 'ACTIVE',
    featured: true,
    priceNegotiable: false,
    features: [],
    safetyFeatures: [],
    views: 1250,
    saves: 89,
    inquiries: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    media: [{ id: '1', fileName: '', originalName: '', mimeType: '', size: 0, type: 'IMAGE', url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80', order: 0, isPrimary: true, createdAt: '', updatedAt: '' }],
  },
  {
    id: '2',
    userId: '2',
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
    city: 'Vancouver',
    province: 'British Columbia',
    country: 'Canada',
    status: 'ACTIVE',
    featured: true,
    priceNegotiable: true,
    features: [],
    safetyFeatures: [],
    views: 890,
    saves: 67,
    inquiries: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    media: [{ id: '2', fileName: '', originalName: '', mimeType: '', size: 0, type: 'IMAGE', url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80', order: 0, isPrimary: true, createdAt: '', updatedAt: '' }],
    dealer: { id: '1', userId: '1', businessName: 'Premium Auto Gallery', verified: true, totalListings: 45, totalSold: 120, rating: 4.8, reviewCount: 89, country: 'Canada', createdAt: '', updatedAt: '' },
  },
  {
    id: '3',
    userId: '3',
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
    city: 'Calgary',
    province: 'Alberta',
    country: 'Canada',
    status: 'ACTIVE',
    featured: true,
    priceNegotiable: false,
    features: [],
    safetyFeatures: [],
    views: 2100,
    saves: 156,
    inquiries: 24,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    media: [{ id: '3', fileName: '', originalName: '', mimeType: '', size: 0, type: 'IMAGE', url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80', order: 0, isPrimary: true, createdAt: '', updatedAt: '' }],
  },
  {
    id: '4',
    userId: '4',
    title: '2023 Porsche 911 Carrera',
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
    city: 'Montreal',
    province: 'Quebec',
    country: 'Canada',
    status: 'ACTIVE',
    featured: true,
    priceNegotiable: true,
    features: [],
    safetyFeatures: [],
    views: 1800,
    saves: 134,
    inquiries: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    media: [{ id: '4', fileName: '', originalName: '', mimeType: '', size: 0, type: 'IMAGE', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', order: 0, isPrimary: true, createdAt: '', updatedAt: '' }],
    dealer: { id: '2', userId: '2', businessName: 'Exotic Motors Montreal', verified: true, totalListings: 28, totalSold: 85, rating: 4.9, reviewCount: 62, country: 'Canada', createdAt: '', updatedAt: '' },
  },
];

export function FeaturedListings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: listings, isLoading, error } = useFeaturedListings(12);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  
  const displayListings = listings && listings.length > 0 ? listings : fallbackListings;

  const saveMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.save(listingId),
    onSuccess: (data, listingId) => {
      setSavedListings(prev => new Set(prev).add(listingId));
      toast.success('Vehicle saved to favorites');
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save vehicle');
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.unsave(listingId),
    onSuccess: (data, listingId) => {
      setSavedListings(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
      toast.success('Vehicle removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove vehicle');
    },
  });

  const handleToggleSave = async (listingId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save vehicles');
      router.push('/login');
      return;
    }

    if (savedListings.has(listingId)) {
      await unsaveMutation.mutateAsync(listingId);
    } else {
      await saveMutation.mutateAsync(listingId);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      api.listings.getSaved()
        .then((savedData) => {
          const savedIds = new Set(savedData.map((listing: any) => listing.id));
          setSavedListings(savedIds);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Featured</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Hand-Picked Vehicles
            </h2>
            <p className="mt-2 text-muted-foreground">
              Curated selection of premium vehicles from verified dealers
            </p>
          </div>
          <Link href="/search?featured=true">
            <Button variant="outline" className="gap-2">
              View All Featured
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            displayListings.map((listing, index) => (
              <VehicleCard 
                key={listing.id} 
                listing={listing} 
                index={index}
                saved={savedListings.has(listing.id)}
                onSave={handleToggleSave}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

