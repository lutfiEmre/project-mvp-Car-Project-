'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Trash2, 
  MapPin, 
  Fuel, 
  Gauge, 
  Calendar,
  ExternalLink,
  Search,
  ArrowLeft,
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
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export default function SavedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const { data: savedListings, isLoading, error } = useQuery({
    queryKey: ['listings', 'saved'],
    queryFn: async () => {
      const data = await api.listings.getSaved();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
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
      toast.error(error.message || 'Failed to unsave vehicle');
    },
    onSuccess: () => {
      toast.success('Vehicle removed from saved');
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
    },
  });

  const handleUnsave = async (listingId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save vehicles');
      router.push('/login');
      return;
    }
    await unsaveMutation.mutateAsync(listingId);
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to view your saved vehicles</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const vehicles = savedListings || [];

  const filteredVehicles = vehicles
    .filter((v: any) => {
      const title = v.title || `${v.year} ${v.make} ${v.model}`;
      return title.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'recent':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="font-display text-3xl font-bold">Saved Vehicles</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? 'Loading...' : `${vehicles.length} vehicles saved`}
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search saved vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Saved</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="year">Newest Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {authLoading || isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 rounded-xl border bg-card">
            <Car className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error loading saved vehicles</p>
            <p className="text-sm text-muted-foreground">{(error as any).message}</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <Heart className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-xl font-semibold">
              {vehicles.length === 0 ? 'No saved vehicles yet' : 'No matching vehicles'}
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              {vehicles.length === 0 
                ? 'Start browsing and click the heart icon on vehicles you like to save them here.'
                : 'Try adjusting your search terms.'}
            </p>
            <Link href="/search">
              <Button className="mt-6" size="lg">
                Browse Vehicles
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle: any, index: number) => {
              const title = vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
              const firstMedia = vehicle.media?.[0];
              const imageUrl = firstMedia?.url || 
                (typeof firstMedia === 'string' ? firstMedia : null) ||
                vehicle.image ||
                '/placeholder-car.jpg';
              const location = [vehicle.city, vehicle.province].filter(Boolean).join(', ') || 'Location N/A';

              return (
                <motion.div
                  key={vehicle.id}
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
                        if (target.src !== '/placeholder-car.jpg') {
                          target.src = '/placeholder-car.jpg';
                        }
                      }}
                    />
                    <button
                      onClick={() => handleUnsave(vehicle.id)}
                      disabled={unsaveMutation.isPending}
                      className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition-all hover:bg-red-50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </button>
                  </div>

                  <div className="p-5">
                    <Link href={`/vehicles/${vehicle.slug || vehicle.id}`}>
                      <h3 className="font-display text-lg font-semibold hover:text-primary transition-colors line-clamp-1">
                        {title}
                      </h3>
                    </Link>
                    <p className="text-2xl font-bold text-primary mt-2">
                      ${(vehicle.price || 0).toLocaleString()}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>
                      {vehicle.mileage && (
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 shrink-0" />
                          {vehicle.mileage.toLocaleString()} km
                        </div>
                      )}
                      {vehicle.fuelType && (
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 shrink-0" />
                          {vehicle.fuelType}
                        </div>
                      )}
                      {vehicle.year && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0" />
                          {vehicle.year}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Link href={`/vehicles/${vehicle.slug || vehicle.id}`} className="flex-1">
                        <Button className="w-full gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 hover:border-red-200"
                        onClick={() => handleUnsave(vehicle.id)}
                        disabled={unsaveMutation.isPending}
                      >
                        {unsaveMutation.isPending && unsaveMutation.variables === vehicle.id ? (
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
    </div>
  );
}
