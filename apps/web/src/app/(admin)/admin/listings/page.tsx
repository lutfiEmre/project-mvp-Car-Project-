'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, 
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Flag,
  Loader2,
  Car,
  Edit,
  Pencil,
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
import { cn, formatPrice, formatNumber, formatMileage } from '@/lib/utils';
import { useAdminListings, useApproveListing, useRejectListing, useDeleteListing } from '@/hooks/use-admin';
import { useUpdateListing } from '@/hooks/use-listings';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { mockListings } from '@/lib/mock-vehicles';
import { getMockVehiclesArray, updateMockVehicle, getMockVehicles } from '@/lib/mock-vehicles-store';

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PENDING_APPROVAL: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

// Fallback data
const fallbackListings = [
  { id: '1', title: '2024 BMW M4 Competition', price: 89900, seller: 'Premium Auto', status: 'ACTIVE', views: 1234, reports: 0, media: [] },
  { id: '2', title: '2023 Mercedes-Benz C300', price: 62500, seller: 'Pacific Motors', status: 'ACTIVE', views: 987, reports: 2, media: [] },
  { id: '3', title: '2024 Audi Q7 Premium', price: 72900, seller: 'John Smith', status: 'PENDING', views: 0, reports: 0, media: [] },
  { id: '4', title: '2022 Porsche Cayenne', price: 85000, seller: 'Calgary Auto', status: 'REJECTED', views: 0, reports: 5, media: [] },
  { id: '5', title: '2023 Tesla Model 3', price: 54990, seller: 'EV Motors', status: 'ACTIVE', views: 2345, reports: 0, media: [] },
];

export default function AdminListingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editFormData, setEditFormData] = useState<any>({});
  const [localListings, setLocalListings] = useState<any[]>([]);
  
  const queryClient = useQueryClient();
  const { data: listingsData, isLoading, error } = useAdminListings({ limit: 50 });
  const approveListing = useApproveListing();
  const rejectListing = useRejectListing();
  const deleteListing = useDeleteListing();
  const updateListing = useUpdateListing();

  // Initialize local listings from mock data store
  useEffect(() => {
    const storedVehicles = getMockVehiclesArray();
    if (storedVehicles.length > 0) {
      setLocalListings(storedVehicles);
    } else {
      setLocalListings(mockListings);
    }
  }, []);

  // Debug: Log API response
  useEffect(() => {
    if (listingsData) {
      console.log('🔵 Admin Listings API Response:', listingsData);
      console.log('🔵 Admin Listings Data Array:', listingsData?.data);
      console.log('🔵 Admin Listings Count:', listingsData?.data?.length || 0);
      if (listingsData?.data?.length > 0) {
        console.log('🔵 First Listing:', listingsData.data[0]);
      }
    }
    if (error) {
      console.error('🔴 Admin Listings API Error:', error);
    }
  }, [listingsData, error]);

  // Debug: Log API response
  if (listingsData) {
    console.log('Admin Listings API Response:', listingsData);
  }
  if (error) {
    console.error('Admin Listings API Error:', error);
  }

  const handleApproveListing = async (id: string) => {
    try {
      await approveListing.mutateAsync(id);
      toast.success('Listing approved successfully');
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['admin', 'listings'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve listing');
    }
  };

  const handleRejectListing = async () => {
    if (!selectedListing) return;
    try {
      await rejectListing.mutateAsync({ id: selectedListing.id, reason: rejectReason });
      toast.success('Listing rejected');
      setRejectDialogOpen(false);
      setSelectedListing(null);
      setRejectReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject listing');
    }
  };

  const handleDeleteListing = async () => {
    if (!selectedListing) return;
    try {
      await deleteListing.mutateAsync(selectedListing.id);
      toast.success('Listing deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedListing(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete listing');
    }
  };

  const handleEditListing = (listing: any) => {
    setSelectedListing(listing);
    setEditFormData({
      title: listing.title || `${listing.year} ${listing.make} ${listing.model}`,
      year: listing.year?.toString() || '',
      make: listing.make || '',
      model: listing.model || '',
      trim: listing.trim || '',
      price: listing.price?.toString() || '',
      mileage: listing.mileage?.toString() || '',
      mileageUnit: listing.mileageUnit || 'km',
      fuelType: listing.fuelType || '',
      transmission: listing.transmission || '',
      driveType: listing.driveType || '',
      bodyType: listing.bodyType || '',
      condition: listing.condition || '',
      exteriorColor: listing.exteriorColor || '',
      interiorColor: listing.interiorColor || '',
      description: listing.description || '',
      status: listing.status || 'ACTIVE',
      city: listing.city || '',
      province: listing.province || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateListing = async () => {
    if (!selectedListing) return;
    try {
      const updatedData = {
        title: editFormData.title,
        year: parseInt(editFormData.year),
        make: editFormData.make,
        model: editFormData.model,
        trim: editFormData.trim || undefined,
        price: parseFloat(editFormData.price),
        mileage: parseInt(editFormData.mileage),
        mileageUnit: editFormData.mileageUnit,
        fuelType: editFormData.fuelType,
        transmission: editFormData.transmission,
        driveType: editFormData.driveType,
        bodyType: editFormData.bodyType,
        condition: editFormData.condition,
        exteriorColor: editFormData.exteriorColor || undefined,
        interiorColor: editFormData.interiorColor || undefined,
        description: editFormData.description || undefined,
        status: editFormData.status,
        city: editFormData.city || undefined,
        province: editFormData.province || undefined,
      };

      // Generate or use existing slug
      const slug = selectedListing.slug || 
        `${editFormData.year}-${editFormData.make?.toLowerCase()}-${editFormData.model?.toLowerCase()}-${selectedListing.id?.substring(0, 8)}`.replace(/\s+/g, '-');

      // Update mock vehicles store (shared across pages)
      updateMockVehicle(slug, { ...updatedData, slug });

      // Update local state for mock data
      const updatedListings = localListings.map((listing: any) => {
        if (listing.id === selectedListing.id) {
          return {
            ...listing,
            ...updatedData,
          };
        }
        return listing;
      });
      setLocalListings(updatedListings);

      // Also try to update via API if it's a real listing (not mock)
      if (selectedListing.id && !selectedListing.id.match(/^[1-6]$/)) {
        try {
          await updateListing.mutateAsync({
            id: selectedListing.id,
            data: {
              title: editFormData.title,
              year: parseInt(editFormData.year),
              make: editFormData.make,
              model: editFormData.model,
              trim: editFormData.trim || undefined,
              price: parseFloat(editFormData.price),
              mileage: parseInt(editFormData.mileage),
              mileageUnit: editFormData.mileageUnit,
              fuelType: editFormData.fuelType,
              transmission: editFormData.transmission,
              driveType: editFormData.driveType,
              bodyType: editFormData.bodyType,
              condition: editFormData.condition,
              exteriorColor: editFormData.exteriorColor || undefined,
              interiorColor: editFormData.interiorColor || undefined,
              description: editFormData.description || undefined,
              status: editFormData.status,
              city: editFormData.city || undefined,
              province: editFormData.province || undefined,
            },
          });
          queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
        } catch (apiError: any) {
          console.warn('API update failed, but local update succeeded:', apiError);
        }
      }

      toast.success('Listing updated successfully');
      setEditDialogOpen(false);
      setSelectedListing(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update listing');
    }
  };

  const listings = useMemo(() => {
    // Use API data first, then fallback to local listings (mock data)
    let items = listingsData?.data || [];
    
    // If no API data, use local listings
    if (items.length === 0) {
      items = localListings.length > 0 ? localListings : mockListings;
    }
    
    // Debug: Log items
    if (items.length > 0) {
      console.log('Admin Listings - First item:', items[0]);
      console.log('Admin Listings - Total items:', items.length);
    } else {
      console.log('Admin Listings - No items from API. listingsData:', listingsData);
    }
    
    // Format title like detail page (year, make, model only, no trim in title)
    items = items.map((listing: any) => {
      // Build title from components (same as detail page display - year, make, model only)
      const title = `${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim();
      
      // Ensure price is a number
      const price = typeof listing.price === 'string' ? parseFloat(listing.price) : (typeof listing.price === 'number' ? listing.price : parseFloat(String(listing.price || 0)));
      
      return {
        ...listing,
        title, // Override with formatted title (year, make, model only)
        price, // Ensure price is a number
        // Seller info from dealer or user
        seller: listing.dealer?.businessName || (listing.user ? `${listing.user.firstName} ${listing.user.lastName}` : 'Unknown'),
      };
    });
    
    // Filter by search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      items = items.filter((listing: any) => 
        listing.title?.toLowerCase().includes(query) ||
        listing.make?.toLowerCase().includes(query) ||
        listing.model?.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      items = items.filter((listing: any) => 
        listing.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    return items;
  }, [listingsData, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const items = listingsData?.data || [];
    return {
      total: items.length,
      active: items.filter((l: any) => l.status === 'ACTIVE' || l.status === 'active').length,
      pending: items.filter((l: any) => l.status === 'PENDING' || l.status === 'PENDING_APPROVAL' || l.status === 'pending').length,
      reported: items.filter((l: any) => (l.reports || 0) > 0).length,
    };
  }, [listingsData]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Listings</h1>
        <p className="text-muted-foreground">
          Manage all vehicle listings on the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Listings', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Pending Review', value: stats.pending },
          { label: 'Reported', value: stats.reported },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border bg-card p-4"
          >
            <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
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
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-red-500">Error loading listings</p>
            <p className="text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Failed to load listings. Please check the console for details.'}
            </p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold">No listings found</p>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              API Response: {listingsData ? `Data exists (${listingsData?.data?.length || 0} items)` : 'No data from API'}
            </p>
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Reports</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listings.map((listing: any, index: number) => {
                  const status = statusConfig[listing.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
                  const seller = listing.dealer?.businessName || listing.user?.firstName || listing.seller || 'Unknown';
                  
                  return (
                    <motion.tr
                      key={listing.id}
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
                              const firstMedia = listing.media?.[0];
                              const imageUrl = firstMedia?.url || (typeof firstMedia === 'string' ? firstMedia : null);
                              
                              // Debug media
                              if (index === 0 && firstMedia) {
                                console.log('🔵 First Listing Media:', firstMedia);
                                console.log('🔵 Image URL:', imageUrl);
                              }
                              
                              if (imageUrl) {
                                return (
                                  <img
                                    src={imageUrl}
                                    alt={listing.title || 'Vehicle'}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      console.error('🔴 Image load error for:', imageUrl);
                                      const target = e.target as HTMLImageElement;
                                      const parent = target.parentElement;
                                      if (parent) {
                                        target.style.display = 'none';
                                        if (!parent.querySelector('svg')) {
                                          parent.innerHTML = '<svg class="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>';
                                        }
                                      }
                                    }}
                                    onLoad={() => {
                                      if (index === 0) console.log('✅ Image loaded successfully:', imageUrl);
                                    }}
                                  />
                                );
                              }
                              return <Car className="w-8 h-8 text-muted-foreground/50" />;
                            })()}
                          </div>
                          <div>
                            <Link 
                              href={`/vehicles/${listing.slug}`}
                              className="font-medium hover:text-primary block"
                              onClick={(e) => {
                                console.log('🔵 Clicked listing:', listing.title);
                                console.log('🔵 Slug:', listing.slug);
                                console.log('🔵 Full URL:', `/vehicles/${listing.slug}`);
                              }}
                            >
                              {listing.title}
                            </Link>
                            {listing.trim && (
                              <p className="text-xs text-muted-foreground mt-0.5">{listing.trim}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="space-y-1">
                          {listing.mileage && (
                            <p className="text-xs text-muted-foreground">
                              {formatMileage(listing.mileage, listing.mileageUnit || 'km')}
                            </p>
                          )}
                          {listing.fuelType && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {listing.fuelType.toLowerCase().replace('_', ' ')}
                            </p>
                          )}
                          {listing.transmission && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {listing.transmission.toLowerCase()}
                            </p>
                          )}
                          {(listing.city || listing.province) && (
                            <p className="text-xs text-muted-foreground">
                              {[listing.city, listing.province].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{seller}</td>
                      <td className="px-4 py-4 font-semibold">{formatPrice(listing.price)}</td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', status.color)}>
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">{formatNumber(listing.views || 0)}</td>
                      <td className="px-4 py-4">
                        {(listing.reports || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <Flag className="h-4 w-4" />
                            {listing.reports}
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
                              <Link href={`/vehicles/${listing.slug || listing.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Listing
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEditListing(listing)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(listing.status === 'PENDING' || listing.status === 'PENDING_APPROVAL' || listing.status === 'pending') && (
                              <>
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={() => handleApproveListing(listing.id)}
                                  disabled={approveListing.isPending}
                                >
                                  {approveListing.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedListing(listing);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedListing(listing);
                                setDeleteDialogOpen(true);
                              }}
                            >
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this listing. The seller will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea
                className="w-full min-h-[100px]"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRejectDialogOpen(false);
              setRejectReason('');
              setSelectedListing(null);
            }}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleRejectListing}
              disabled={rejectListing.isPending}
            >
              {rejectListing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="py-4">
              <p className="font-medium">{selectedListing.title}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(selectedListing.price)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedListing(null);
            }}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteListing}
              disabled={deleteListing.isPending}
            >
              {deleteListing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>
              Update the listing information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-year">Year</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-make">Make</Label>
                  <Input
                    id="edit-make"
                    value={editFormData.make}
                    onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-model">Model</Label>
                  <Input
                    id="edit-model"
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-trim">Trim</Label>
                  <Input
                    id="edit-trim"
                    value={editFormData.trim}
                    onChange={(e) => setEditFormData({ ...editFormData, trim: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mileage">Mileage</Label>
                  <Input
                    id="edit-mileage"
                    type="number"
                    value={editFormData.mileage}
                    onChange={(e) => setEditFormData({ ...editFormData, mileage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fuelType">Fuel Type</Label>
                  <Select
                    value={editFormData.fuelType}
                    onValueChange={(value) => setEditFormData({ ...editFormData, fuelType: value })}
                  >
                    <SelectTrigger id="edit-fuelType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GASOLINE">Gasoline</SelectItem>
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="ELECTRIC">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-transmission">Transmission</Label>
                  <Select
                    value={editFormData.transmission}
                    onValueChange={(value) => setEditFormData({ ...editFormData, transmission: value })}
                  >
                    <SelectTrigger id="edit-transmission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="CVT">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-driveType">Drive Type</Label>
                  <Select
                    value={editFormData.driveType}
                    onValueChange={(value) => setEditFormData({ ...editFormData, driveType: value })}
                  >
                    <SelectTrigger id="edit-driveType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FWD">FWD</SelectItem>
                      <SelectItem value="RWD">RWD</SelectItem>
                      <SelectItem value="AWD">AWD</SelectItem>
                      <SelectItem value="FOUR_WD">4WD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bodyType">Body Type</Label>
                  <Select
                    value={editFormData.bodyType}
                    onValueChange={(value) => setEditFormData({ ...editFormData, bodyType: value })}
                  >
                    <SelectTrigger id="edit-bodyType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEDAN">Sedan</SelectItem>
                      <SelectItem value="COUPE">Coupe</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                      <SelectItem value="WAGON">Wagon</SelectItem>
                      <SelectItem value="CONVERTIBLE">Convertible</SelectItem>
                      <SelectItem value="PICKUP">Pickup</SelectItem>
                      <SelectItem value="VAN">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-condition">Condition</Label>
                  <Select
                    value={editFormData.condition}
                    onValueChange={(value) => setEditFormData({ ...editFormData, condition: value })}
                  >
                    <SelectTrigger id="edit-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="USED">Used</SelectItem>
                      <SelectItem value="CERTIFIED_PRE_OWNED">Certified Pre-Owned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-province">Province</Label>
                  <Input
                    id="edit-province"
                    value={editFormData.province}
                    onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-exteriorColor">Exterior Color</Label>
                  <Input
                    id="edit-exteriorColor"
                    value={editFormData.exteriorColor}
                    onChange={(e) => setEditFormData({ ...editFormData, exteriorColor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-interiorColor">Interior Color</Label>
                  <Input
                    id="edit-interiorColor"
                    value={editFormData.interiorColor}
                    onChange={(e) => setEditFormData({ ...editFormData, interiorColor: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  className="min-h-[100px]"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setSelectedListing(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateListing}
              disabled={updateListing.isPending}
            >
              {updateListing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              Update Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
