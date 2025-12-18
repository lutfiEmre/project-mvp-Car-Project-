'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Car,
  Loader2,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const { user: currentUser } = useAuth();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/profile`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('User not found');
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['user-listings', userId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/listings?userId=${userId}&status=ACTIVE`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: savedListings } = useQuery({
    queryKey: ['saved-listings'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/saved-listings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!currentUser,
  });

  const handleToggleSave = async (listingId: string) => {
    if (!currentUser) {
      toast.error('Please login to save listings');
      return;
    }

    const isSaved = savedListings?.some((l: any) => l.id === listingId);

    try {
      if (isSaved) {
        await api.listings.unsave(listingId);
        toast.success('Removed from saved');
      } else {
        await api.listings.save(listingId);
        toast.success('Saved successfully');
      }
    } catch (error) {
      toast.error('Failed to update saved status');
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/search">Browse Listings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const listings = listingsData?.data || [];
  const totalListings = listingsData?.meta?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden">
            {user.bannerImage && (
              <div className="relative h-48 w-full bg-gradient-to-r from-primary/20 to-primary/10">
                <Image
                  src={user.bannerImage}
                  alt="Profile banner"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <Avatar className={`h-32 w-32 border-4 border-primary/10 ${user.bannerImage ? '-mt-20' : ''}`}>
                    <AvatarImage
                      src={user.avatar || ''}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="text-3xl">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="font-display text-3xl font-bold mb-2">
                        {user.firstName} {user.lastName}
                      </h1>
                      <Badge variant="secondary" className="mb-4">
                        <User className="h-3 w-3 mr-1" />
                        Private Seller
                      </Badge>
                      {(user.city || user.province) && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">
                            {[user.city, user.province].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {user.bio && (
                        <p className="text-muted-foreground mt-4 max-w-2xl">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        Member since {new Date(user.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Car className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{totalListings}</div>
                        <div className="text-sm text-muted-foreground">Active Listings</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">
              Listings ({totalListings})
            </h2>
          </div>

          {listingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing: any, index: number) => {
                const isSaved = savedListings?.some((l: any) => l.id === listing.id);
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <VehicleCard
                      listing={listing}
                      saved={isSaved}
                      onSave={() => handleToggleSave(listing.id)}
                    />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
                <p className="text-muted-foreground text-center">
                  This user hasn't listed any vehicles for sale.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

