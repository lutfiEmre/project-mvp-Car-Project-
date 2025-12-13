'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Car, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const listings = [
  {
    id: '1',
    title: '2023 BMW M4 Competition',
    price: 89900,
    status: 'active',
    views: 234,
    inquiries: 12,
    location: 'Toronto, ON',
    createdAt: '2024-01-15',
    slug: '2023-bmw-m4-competition',
  },
  {
    id: '2',
    title: '2022 Audi Q5 Premium Plus',
    price: 52900,
    status: 'pending',
    views: 0,
    inquiries: 0,
    location: 'Toronto, ON',
    createdAt: '2024-01-18',
    slug: '2022-audi-q5-premium-plus',
  },
  {
    id: '3',
    title: '2021 Honda Accord Sport',
    price: 32500,
    status: 'sold',
    views: 567,
    inquiries: 28,
    location: 'Toronto, ON',
    createdAt: '2023-12-01',
    slug: '2021-honda-accord-sport',
  },
];

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  sold: {
    label: 'Sold',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
  expired: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: AlertCircle,
  },
};

export default function MyListingsPage() {
  const [items, setItems] = useState(listings);

  const deleteListing = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">My Listings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your vehicle listings
              </p>
            </div>
            <Link href="/dashboard/listings/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Listing
              </Button>
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <Car className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 font-display text-xl font-semibold">
              No listings yet
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Create your first listing and start selling your vehicle today.
            </p>
            <Link href="/dashboard/listings/new">
              <Button className="mt-6 gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Create Your First Listing
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {items.map((listing, index) => {
              const status = statusConfig[listing.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border bg-card p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <div className="relative aspect-[16/10] sm:aspect-square sm:w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={(listing as any).media?.[0]?.url || '/placeholder-car.jpg'}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/placeholder-car.jpg') {
                            target.src = '/placeholder-car.jpg';
                          }
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={`/vehicles/${listing.slug}`}>
                            <h3 className="font-display font-semibold hover:text-primary transition-colors">
                              {listing.title}
                            </h3>
                          </Link>
                          <p className="text-xl font-bold text-primary mt-1">
                            ${listing.price.toLocaleString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/vehicles/${listing.slug}`} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Listing
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/listings/${listing.id}/edit`} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Listing
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer"
                              onClick={() => deleteListing(listing.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Listing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {listing.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {listing.createdAt}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                          status.color
                        )}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                        
                        {listing.status === 'active' && (
                          <>
                            <span className="text-sm text-muted-foreground">
                              <Eye className="inline h-4 w-4 mr-1" />
                              {listing.views} views
                            </span>
                            <span className="text-sm text-muted-foreground">
                              💬 {listing.inquiries} inquiries
                            </span>
                          </>
                        )}
                      </div>
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

