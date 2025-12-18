'use client';

import { useRouter } from 'next/navigation';
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
  ArrowLeft,
  Loader2,
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
import { useMyListings } from '@/hooks/use-listings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

const statusConfig = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
  },
  PENDING_APPROVAL: {
    label: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  SOLD: {
    label: 'Sold',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: AlertCircle,
  },
  INACTIVE: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: AlertCircle,
  },
};

export default function MyListingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: myListingsData, isLoading, error } = useMyListings();

  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.delete(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'my'] });
      toast.success('Listing deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete listing');
    },
  });

  const listings = Array.isArray(myListingsData) 
    ? myListingsData 
    : (myListingsData?.data || []);

  const handleDelete = async (listingId: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      await deleteMutation.mutateAsync(listingId);
    }
  };

  const handleViewListing = (listing: any) => {
    if (listing.slug) {
      router.push(`/vehicles/${listing.slug}`);
    } else {
      toast.error('Listing slug not available');
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to view your listings</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

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

        {authLoading || isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 rounded-xl border bg-card">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error loading listings</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : listings.length === 0 ? (
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
            {listings.map((listing: any, index: number) => {
              const statusKey = listing.status || 'ACTIVE';
              const status = statusConfig[statusKey as keyof typeof statusConfig] || statusConfig.ACTIVE;
              const StatusIcon = status.icon;
              const title = listing.title || 
                `${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim() ||
                'Untitled Listing';
              const firstMedia = listing.media?.[0];
              const imageUrl = firstMedia?.url || 
                (typeof firstMedia === 'string' ? firstMedia : '/placeholder-car.jpg');
              
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
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/placeholder-car.jpg') {
                            target.src = '/placeholder-car.jpg';
                          }
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button 
                            onClick={() => handleViewListing(listing)}
                            className="text-left"
                          >
                            <h3 className="font-display font-semibold hover:text-primary transition-colors">
                              {title}
                            </h3>
                          </button>
                          <p className="text-xl font-bold text-primary mt-1">
                            ${(listing.price || 0).toLocaleString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleViewListing(listing)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Listing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => router.push(`/dashboard/listings/${listing.id}/edit`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleDelete(listing.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Listing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {(listing.city || listing.province) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {[listing.city, listing.province].filter(Boolean).join(', ')}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(listing.createdAt).toLocaleDateString()}
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
                        
                        {statusKey === 'ACTIVE' && (
                          <>
                            <span className="text-sm text-muted-foreground">
                              <Eye className="inline h-4 w-4 mr-1" />
                              {listing.views || 0} views
                            </span>
                            <span className="text-sm text-muted-foreground">
                              💬 {listing.inquiries || 0} inquiries
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

