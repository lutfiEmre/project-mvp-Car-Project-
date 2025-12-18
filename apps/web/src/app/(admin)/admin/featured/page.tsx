'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  ArrowUp, 
  ArrowDown,
  Check,
  X,
  Loader2,
  AlertCircle,
  Eye,
  Clock,
  Search,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatPrice } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default function AdminFeaturedPage() {
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featuredDays, setFeaturedDays] = useState<number>(30);
  const [featuredOrder, setFeaturedOrder] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [allListingsDialogOpen, setAllListingsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['admin', 'featured-requests'],
    queryFn: () => api.admin.getFeaturedRequests(),
  });

  const { data: featuredListings, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['admin', 'featured-listings'],
    queryFn: () => api.admin.getFeaturedListings(),
  });

  const { data: allListings, isLoading: isLoadingAllListings } = useQuery({
    queryKey: ['admin', 'all-listings', searchTerm],
    queryFn: () => api.admin.getAllListings({ 
      page: 1, 
      limit: 100,
    }),
    enabled: allListingsDialogOpen,
  });

  const featureMutation = useMutation({
    mutationFn: ({ listingId, featured, days, order }: { listingId: string; featured: boolean; days?: number; order?: number }) =>
      api.admin.featureListing(listingId, featured, days, order),
    onSuccess: () => {
      toast.success('Listing featured status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'featured-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'featured-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'all-listings'] });
      setFeatureDialogOpen(false);
      setAllListingsDialogOpen(false);
      setSelectedListing(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update featured status';
      toast.error(errorMessage);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ listingId, order }: { listingId: string; order: number }) => {
      console.log('Updating order:', listingId, 'to', order);
      return api.admin.updateFeaturedOrder(listingId, order);
    },
    onSuccess: async (data) => {
      console.log('Order update success:', data);
      toast.success('Featured order updated');
      // Force refetch to get updated order
      await queryClient.refetchQueries({ queryKey: ['admin', 'featured-listings'] });
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'featured-listings'] });
    },
    onError: (error: any) => {
      console.error('Order update error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update order';
      toast.error(errorMessage);
    },
  });

  const handleFeature = (listing: any, featured: boolean) => {
    setSelectedListing(listing);
    setFeaturedDays(30);
    const maxOrder = sortedFeaturedListings?.length || 0;
    // Set to next available position (1-based), max 10
    setFeaturedOrder(Math.min(maxOrder + 1, 10));
    setFeatureDialogOpen(true);
  };

  const handleApproveRequest = () => {
    if (!selectedListing) return;
    
    // Validate order (1-10 in UI, 0-9 in backend)
    if (featuredOrder < 1 || featuredOrder > 10) {
      toast.error('Featured order must be between 1 and 10.');
      return;
    }

    const currentFeaturedCount = featuredListings?.length || 0;
    if (currentFeaturedCount >= 10 && !selectedListing.featured) {
      toast.error('Maximum 10 featured listings allowed. Please remove one before adding another.');
      return;
    }

    // Convert 1-based UI order to 0-based backend order
    const backendOrder = featuredOrder - 1;

    featureMutation.mutate({
      listingId: selectedListing.id,
      featured: true,
      days: featuredDays,
      order: backendOrder,
    });
  };

  const handleUnfeature = (listing: any) => {
    if (!listing) return;
    featureMutation.mutate({
      listingId: listing.id,
      featured: false,
    });
  };

  const handleRejectRequest = (listing: any) => {
    if (!listing) return;
    featureMutation.mutate({
      listingId: listing.id,
      featured: false,
    });
  };

  const handleMoveUp = (e: React.MouseEvent, listing: any) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    const currentOrder = listing.featuredOrder ?? sortedFeaturedListings?.findIndex((l: any) => l.id === listing.id) ?? 0;
    
    if (currentOrder <= 0) {
      toast.error('Already at the top');
      return;
    }
    
    const newOrder = currentOrder - 1;
    console.log('Moving up:', listing.id, 'from order', currentOrder, 'to', newOrder);
    
    updateOrderMutation.mutate({
      listingId: listing.id,
      order: newOrder,
    });
  };

  const handleMoveDown = (e: React.MouseEvent, listing: any) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    const currentOrder = listing.featuredOrder ?? sortedFeaturedListings?.findIndex((l: any) => l.id === listing.id) ?? 0;
    const maxOrder = (sortedFeaturedListings?.length ?? 1) - 1;
    
    if (currentOrder >= maxOrder) {
      toast.error('Already at the bottom');
      return;
    }
    
    const newOrder = currentOrder + 1;
    console.log('Moving down:', listing.id, 'from order', currentOrder, 'to', newOrder);
    
    updateOrderMutation.mutate({
      listingId: listing.id,
      order: newOrder,
    });
  };


  const filteredAllListings = useMemo(() => {
    if (!allListings?.data) {
      console.log('No listings data:', allListings);
      return [];
    }
    console.log('All listings:', allListings.data.length);
    const listings = allListings.data.filter((listing: any) => 
      listing.status !== 'PENDING_APPROVAL' && 
      listing.featuredRequestStatus !== 'PENDING'
    );
    console.log('Filtered listings (after status filter):', listings.length);
    
    if (!searchTerm) return listings;
    
    const search = searchTerm.toLowerCase();
    const filtered = listings.filter((listing: any) =>
      listing.title?.toLowerCase().includes(search) ||
      listing.make?.toLowerCase().includes(search) ||
      listing.model?.toLowerCase().includes(search) ||
      listing.dealer?.businessName?.toLowerCase().includes(search) ||
      listing.user?.email?.toLowerCase().includes(search)
    );
    console.log('Filtered listings (after search):', filtered.length);
    return filtered;
  }, [allListings, searchTerm]);

  const sortedFeaturedListings = useMemo(() => {
    if (!featuredListings) return [];
    return [...featuredListings].sort((a: any, b: any) => {
      const orderA = a.featuredOrder ?? 999;
      const orderB = b.featuredOrder ?? 999;
      return orderA - orderB;
    });
  }, [featuredListings]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Featured Listings Management</h1>
          <p className="text-muted-foreground">
            Manage featured listings, approve requests, and control display order
          </p>
        </div>
        <Button onClick={() => setAllListingsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Featured Listing
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pending Requests ({requests?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : requests?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(requests || []).map((request: any) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          href={`/vehicles/${request.slug}`}
                          target="_blank"
                          className="font-semibold hover:text-primary"
                        >
                          {request.title}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.dealer?.businessName || 'Private Seller'}
                        </p>
                        <p className="text-sm font-medium mt-2">
                          {formatPrice(Number(request.price))}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleFeature(request, true)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Listings ({sortedFeaturedListings?.length || 0}/10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFeatured ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sortedFeaturedListings?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No featured listings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedFeaturedListings.map((listing: any, index: number) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.05,
                      duration: 0.2,
                    }}
                    layout
                    className="p-4 rounded-lg border bg-card transition-all duration-200 hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Sıra Numarası */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-base">
                          {listing.featuredOrder !== null ? listing.featuredOrder + 1 : index + 1}
                        </div>
                        {/* Yukarı/Aşağı Okları */}
                        <div className="flex flex-col gap-1">
                          <button
                            className="flex items-center justify-center h-7 w-7 rounded hover:bg-primary/10 active:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              e.nativeEvent.stopImmediatePropagation();
                              handleMoveUp(e, listing);
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            disabled={(listing.featuredOrder ?? index) <= 0 || updateOrderMutation.isPending}
                            type="button"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            className="flex items-center justify-center h-7 w-7 rounded hover:bg-primary/10 active:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              e.nativeEvent.stopImmediatePropagation();
                              handleMoveDown(e, listing);
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            disabled={(listing.featuredOrder ?? index) >= (sortedFeaturedListings?.length ?? 1) - 1 || updateOrderMutation.isPending}
                            type="button"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/vehicles/${listing.slug}`}
                              target="_blank"
                              className="font-semibold hover:text-primary"
                            >
                              {listing.title}
                            </Link>
                            <Badge variant="default" className="bg-yellow-500">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {listing.dealer?.businessName || 'Private Seller'}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {formatPrice(Number(listing.price))}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnfeature(listing)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Unfeature
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feature Listing</DialogTitle>
            <DialogDescription>
              Configure featured listing settings
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Featured Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={featuredDays}
                  onChange={(e) => setFeaturedDays(parseInt(e.target.value) || 30)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for permanent featured status
                </p>
              </div>
              <div>
                <Label>Display Order (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={featuredOrder}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    if (value < 1 || value > 10) {
                      toast.error('Featured order must be between 1 and 10');
                      return;
                    }
                    setFeaturedOrder(value);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Position in featured list (1-10). Lower numbers appear first. Maximum 10 featured listings allowed.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveRequest}
              disabled={featureMutation.isPending}
            >
              {featureMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Feature Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Listings Dialog */}
      <Dialog open={allListingsDialogOpen} onOpenChange={setAllListingsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Featured Listing</DialogTitle>
            <DialogDescription>
              Search and select a listing to feature (excluding pending requests)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex flex-col flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search listings by title, make, model, dealer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
              {isLoadingAllListings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredAllListings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isLoadingAllListings ? 'Loading...' : searchTerm ? 'No listings found matching your search' : 'No listings available'}
                  </p>
                  {allListings?.data && allListings.data.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing {allListings.data.length} total listings
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAllListings.map((listing: any) => (
                    <div
                      key={listing.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/vehicles/${listing.slug}`}
                            target="_blank"
                            className="font-semibold hover:text-primary"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {listing.dealer?.businessName || listing.user?.email || 'Private Seller'}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {formatPrice(Number(listing.price))}
                          </p>
                          {listing.featured && (
                            <Badge variant="default" className="bg-yellow-500 mt-2">
                              <Star className="h-3 w-3 mr-1" />
                              Already Featured
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={listing.featured ? "outline" : "default"}
                          onClick={() => {
                            if (listing.featured) {
                              handleUnfeature(listing);
                            } else {
                              handleFeature(listing, true);
                              setAllListingsDialogOpen(false);
                            }
                          }}
                          disabled={listing.featuredRequestStatus === 'PENDING'}
                        >
                          {listing.featured ? (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Unfeature
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-1" />
                              Feature
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllListingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
