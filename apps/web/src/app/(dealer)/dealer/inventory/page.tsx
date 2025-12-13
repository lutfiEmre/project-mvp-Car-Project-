'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Car,
  Flag,
  Star,
  MessageSquare,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatPrice, formatNumber, formatMileage, formatDate } from '@/lib/utils';
import { useDealerInventory } from '@/hooks/use-dealer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PENDING_APPROVAL: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  SOLD: { label: 'Sold', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

// Fallback data
const fallbackInventory = [
  {
    id: '1',
    title: '2024 BMW M4 Competition',
    price: 89900,
    status: 'ACTIVE',
    views: 456,
    inquiries: 23,
    vin: '1HGBH41JXMN109186',
    media: [{ url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=200&q=80' }],
  },
  {
    id: '2',
    title: '2024 Mercedes-Benz C300',
    price: 62500,
    status: 'ACTIVE',
    views: 312,
    inquiries: 15,
    vin: '1HGBH41JXMN109187',
    media: [{ url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=200&q=80' }],
  },
  {
    id: '3',
    title: '2023 Audi Q7 Premium',
    price: 72900,
    status: 'PENDING',
    views: 0,
    inquiries: 0,
    vin: '1HGBH41JXMN109188',
    media: [{ url: 'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=200&q=80' }],
  },
  {
    id: '4',
    title: '2022 Porsche Cayenne',
    price: 85000,
    status: 'SOLD',
    views: 892,
    inquiries: 45,
    vin: '1HGBH41JXMN109189',
    media: [{ url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=80' }],
  },
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();
  
  const { data: inventoryData, isLoading, error } = useDealerInventory();

  // Fetch reviews for selected listing
  const { data: listingReviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['listing', 'reviews', selectedListing?.id],
    queryFn: async () => {
      if (!selectedListing?.id) return [];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/listings/${selectedListing.id}/reviews`
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedListing?.id && reviewsDialogOpen,
  });

  // Reply to review mutation for listing reviews
  const replyToReviewMutation = useMutation({
    mutationFn: async ({ reviewId, reply, listingId }: { reviewId: string; reply: string; listingId: string }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/listings/${listingId}/reviews/${reviewId}/response`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ response: reply }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send reply');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Reply sent successfully!');
      setReplyingToReview(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['listing', 'reviews', selectedListing?.id] });
      queryClient.invalidateQueries({ queryKey: ['dealer', 'reviews'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reply');
    },
  });

  // Debug: Log API response
  useEffect(() => {
    if (inventoryData) {
      console.log('🔵 Dealer Inventory API Response:', inventoryData);
      console.log('🔵 Dealer Inventory Data Array:', inventoryData?.data);
      console.log('🔵 Dealer Inventory Count:', inventoryData?.data?.length || 0);
      if (inventoryData?.data?.length > 0) {
        console.log('🔵 First Item:', inventoryData.data[0]);
      }
    }
    if (error) {
      console.error('🔴 Dealer Inventory API Error:', error);
    }
  }, [inventoryData, error]);

  const inventory = useMemo(() => {
    // Use API data only - same structure as admin listings
    // getMyListings returns array directly or PaginatedResponse with data property
    let items = Array.isArray(inventoryData) ? inventoryData : (inventoryData?.data || []);
    
    // Debug: Log items
    if (items.length > 0) {
      console.log('🔵 Dealer Inventory - First item:', items[0]);
      console.log('🔵 Dealer Inventory - Total items:', items.length);
      console.log('🔵 Dealer Inventory - First item slug:', items[0]?.slug);
      console.log('🔵 Dealer Inventory - First item media:', items[0]?.media);
    } else {
      console.log('🔵 Dealer Inventory - No items from API. inventoryData:', inventoryData);
    }
    
    // Transform items to format title like detail page (year, make, model only, no trim)
    // Same transformation as admin listings
    items = items.map((item: any) => {
      // Build title from components (same as detail page display - year, make, model only)
      const title = `${item.year || ''} ${item.make || ''} ${item.model || ''}`.trim();
      
      // Ensure price is a number
      const price = typeof item.price === 'string' ? parseFloat(item.price) : (typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)));
      
      // Generate slug if not exists (same as admin listings)
      const slug = item.slug || 
        `${item.year}-${item.make?.toLowerCase()}-${item.model?.toLowerCase()}-${item.id?.substring(0, 8)}`.replace(/\s+/g, '-');
      
      return {
        ...item,
        title, // Override with formatted title (year, make, model only)
        price, // Ensure price is a number
        slug, // Ensure slug exists for navigation
        // Seller info from dealer or user
        seller: item.dealer?.businessName || (item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown'),
        // Ensure views and inquiries exist
        views: item.views || 0,
        inquiries: item.inquiries || 0,
        reports: item.reports || 0,
        // Ensure VIN exists
        vin: item.vin || `VIN-${item.id?.substring(0, 8) || 'UNKNOWN'}`,
      };
    });
    
    // Filter by search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      items = items.filter((item: any) => 
        item.title?.toLowerCase().includes(query) ||
        item.make?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.vin?.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      items = items.filter((item: any) => 
        item.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    return items;
  }, [inventoryData, searchTerm, statusFilter]);

  // Fetch reviews count for all listings (after inventory is defined)
  const listingIds = useMemo(() => inventory.map((item: any) => item.id), [inventory]);
  const { data: allReviewsData } = useQuery({
    queryKey: ['listings', 'reviews', 'counts', listingIds],
    queryFn: async () => {
      const reviewsMap: Record<string, number> = {};
      await Promise.all(
        listingIds.map(async (id: string) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/listings/${id}/reviews`
            );
            if (response.ok) {
              const reviews = await response.json();
              reviewsMap[id] = Array.isArray(reviews) ? reviews.length : 0;
            }
          } catch {
            reviewsMap[id] = 0;
          }
        })
      );
      return reviewsMap;
    },
    enabled: listingIds.length > 0,
  });

  const stats = useMemo(() => {
    // Use inventory from useMemo above
    const items = inventory;
    return {
      total: items.length,
      active: items.filter((i: any) => i.status === 'ACTIVE').length,
      pending: items.filter((i: any) => i.status === 'PENDING' || i.status === 'PENDING_APPROVAL').length,
      sold: items.filter((i: any) => i.status === 'SOLD').length,
    };
  }, [inventory]);

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your vehicle inventory
          </p>
        </div>
        <Link href="/dealer/inventory/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or VIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Vehicles', value: stats.total },
          { label: 'Active Listings', value: stats.active },
          { label: 'Pending Review', value: stats.pending },
          { label: 'Sold This Month', value: stats.sold },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold">No vehicles found</p>
            <p className="text-muted-foreground mt-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first vehicle to get started'}
            </p>
            <Link href="/dealer/inventory/new">
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Seller</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Views</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Reviews</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Reports</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventory.map((item: any, index: number) => {
                  const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
                  const seller = item.dealer?.businessName || item.user?.firstName || item.seller || 'Unknown';
                  
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                            {(() => {
                              // Get first media URL - handle both object and string formats
                              const firstMedia = item.media?.[0];
                              const imageUrl = firstMedia?.url || (typeof firstMedia === 'string' ? firstMedia : null);
                              
                              if (imageUrl) {
                                return (
                                  <img
                                    src={imageUrl}
                                    alt={item.title || 'Vehicle'}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      const parent = target.parentElement;
                                      if (parent) {
                                        target.style.display = 'none';
                                        if (!parent.querySelector('svg')) {
                                          parent.innerHTML = '<svg class="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>';
                                        }
                                      }
                                    }}
                                  />
                                );
                              }
                              return <Car className="w-8 h-8 text-muted-foreground/50" />;
                            })()}
                          </div>
                          <div>
                            <Link 
                              href={`/vehicles/${item.slug || item.id}`}
                              className="font-medium hover:text-primary block"
                              onClick={(e) => {
                                console.log('🔵 Clicked item:', item.title);
                                console.log('🔵 Slug:', item.slug);
                                console.log('🔵 Full URL:', `/vehicles/${item.slug || item.id}`);
                              }}
                            >
                              {item.title}
                            </Link>
                            {item.trim && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.trim}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="space-y-1">
                          {item.mileage && (
                            <p className="text-xs text-muted-foreground">
                              {formatMileage(item.mileage, item.mileageUnit || 'km')}
                            </p>
                          )}
                          {item.fuelType && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.fuelType.toLowerCase().replace('_', ' ')}
                            </p>
                          )}
                          {item.transmission && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.transmission.toLowerCase()}
                            </p>
                          )}
                          {(item.city || item.province) && (
                            <p className="text-xs text-muted-foreground">
                              {[item.city, item.province].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{seller}</td>
                      <td className="px-4 py-4 font-semibold">{formatPrice(item.price)}</td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', status.color)}>
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">{formatNumber(item.views || 0)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            setSelectedListing(item);
                            setReviewsDialogOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Star className="h-4 w-4" />
                          {allReviewsData?.[item.id] || item._count?.reviews || 0}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        {(item.reports || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <Flag className="h-4 w-4" />
                            {item.reports}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/vehicles/${item.slug || item.id}`} className="flex items-center cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedListing(item);
                                setReviewsDialogOpen(true);
                              }}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              View Reviews
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dealer/inventory/${item.id}/edit`} className="flex items-center cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reviews Dialog */}
      <Dialog open={reviewsDialogOpen} onOpenChange={setReviewsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Reviews for {selectedListing?.title || 'Listing'}
            </DialogTitle>
            <DialogDescription>
              Customer reviews for this listing
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {isLoadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !listingReviews || listingReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No reviews yet for this listing</p>
              </div>
            ) : (
              <div className="space-y-4">
                {listingReviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {review.reviewerName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'AN'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{review.reviewerName || 'Anonymous'}</p>
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
                        </div>
                        {review.createdAt && (
                          <span className="text-sm text-muted-foreground">
                            {formatDate(review.createdAt)}
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
                      {review.dealerResponse ? (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Your Response</span>
                            {review.dealerResponseAt && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatDate(review.dealerResponseAt)}
                              </span>
                            )}
                          </div>
                          <div className="rounded-lg bg-primary/10 p-4">
                            <p className="text-sm whitespace-pre-wrap">{review.dealerResponse}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setReplyingToReview(review.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Edit Response
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t">
                          {replyingToReview === review.id ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Write your reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={3}
                              className="resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReplyingToReview(null);
                                  setReplyText('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!replyText.trim()) {
                                    toast.error('Please write a reply');
                                    return;
                                  }
                                  replyToReviewMutation.mutate({
                                    reviewId: review.id,
                                    reply: replyText,
                                    listingId: selectedListing.id,
                                  });
                                }}
                                disabled={replyToReviewMutation.isPending}
                              >
                                {replyToReviewMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  'Send Reply'
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyingToReview(review.id)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Reply
                          </Button>
                        )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
