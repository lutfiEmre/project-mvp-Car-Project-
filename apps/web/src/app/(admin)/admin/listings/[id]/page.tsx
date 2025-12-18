'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Shield,
  Loader2,
  ExternalLink,
  Car,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatPrice, formatMileage } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: Clock },
  SOLD: { label: 'Sold', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  EXPIRED: { label: 'Expired', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Clock },
};

export default function AdminListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const queryClient = useQueryClient();
  const [currentImage, setCurrentImage] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['admin', 'listing', listingId],
    queryFn: () => api.admin.getListingById(listingId),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.admin.approveListing(listingId),
    onSuccess: () => {
      toast.success('Listing approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve listing');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason?: string) => api.admin.rejectListing(listingId, reason),
    onSuccess: () => {
      toast.success('Listing rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reject listing');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.admin.updateListingStatus(listingId, status),
    onSuccess: () => {
      toast.success('Listing status updated');
      setStatusDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'listing', listingId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.deleteListing(listingId),
    onSuccess: () => {
      toast.success('Listing deleted');
      router.push('/admin/listings');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete listing');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg font-semibold text-destructive mb-2">Listing not found</p>
        <Button onClick={() => router.push('/admin/listings')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[listing.status] || statusConfig.DRAFT;
  const StatusIcon = statusInfo.icon;
  const images = listing.media || [];
  const primaryImage = images.find((img: any) => img.isPrimary) || images[0];
  const currentImageUrl = images[currentImage]?.url || primaryImage?.url || '/placeholder-vehicle.jpg';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/listings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">{listing.title}</h1>
            <p className="text-muted-foreground">Listing ID: {listing.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
          {listing.featured && (
            <Badge variant="default" className="bg-yellow-500">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {listing.status === 'PENDING_APPROVAL' && (
          <>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="gap-2"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectDialogOpen(true)}
              disabled={rejectMutation.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => setStatusDialogOpen(true)}
          disabled={updateStatusMutation.isPending}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Change Status
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/vehicles/${listing.slug}`)}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View Public Page
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this listing?')) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
          className="gap-2"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                {images.length > 0 ? (
                  <>
                    <img
                      src={currentImageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_: any, idx: number) => (
                            <button
                              key={idx}
                              className={`h-2 w-2 rounded-full transition-all ${
                                idx === currentImage ? 'bg-white' : 'bg-white/50'
                              }`}
                              onClick={() => setCurrentImage(idx)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Car className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`aspect-video rounded overflow-hidden border-2 transition-all ${
                        idx === currentImage ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${listing.title} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {listing.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-semibold">{listing.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-semibold">{listing.make}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-semibold">{listing.model}</p>
                </div>
                {listing.trim && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trim</p>
                    <p className="font-semibold">{listing.trim}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Mileage</p>
                  <p className="font-semibold">{formatMileage(listing.mileage, listing.mileageUnit)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuel Type</p>
                  <p className="font-semibold">{listing.fuelType?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transmission</p>
                  <p className="font-semibold">{listing.transmission?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drive Type</p>
                  <p className="font-semibold">{listing.driveType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Body Type</p>
                  <p className="font-semibold">{listing.bodyType?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-semibold">{listing.condition}</p>
                </div>
                {listing.exteriorColor && (
                  <div>
                    <p className="text-sm text-muted-foreground">Exterior Color</p>
                    <p className="font-semibold">{listing.exteriorColor}</p>
                  </div>
                )}
                {listing.interiorColor && (
                  <div>
                    <p className="text-sm text-muted-foreground">Interior Color</p>
                    <p className="font-semibold">{listing.interiorColor}</p>
                  </div>
                )}
                {listing.engineSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Engine Size</p>
                    <p className="font-semibold">{listing.engineSize}L</p>
                  </div>
                )}
                {listing.horsepower && (
                  <div>
                    <p className="text-sm text-muted-foreground">Horsepower</p>
                    <p className="font-semibold">{listing.horsepower} HP</p>
                  </div>
                )}
                {listing.vin && (
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-semibold font-mono text-xs">{listing.vin}</p>
                  </div>
                )}
                {listing.stockNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Number</p>
                    <p className="font-semibold">{listing.stockNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          {listing.features && listing.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feature: string, idx: number) => (
                    <Badge key={idx} variant="outline">{feature}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safety Features */}
          {listing.safetyFeatures && listing.safetyFeatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Safety Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {listing.safetyFeatures.map((feature: string, idx: number) => (
                    <Badge key={idx} variant="outline">{feature}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-3xl font-bold">{formatPrice(Number(listing.price))}</p>
                {listing.originalPrice && Number(listing.originalPrice) > Number(listing.price) && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(Number(listing.originalPrice))}
                  </p>
                )}
              </div>
              {listing.priceNegotiable && (
                <Badge variant="outline">Price Negotiable</Badge>
              )}
            </CardContent>
          </Card>

          {/* Owner/Dealer */}
          <Card>
            <CardHeader>
              <CardTitle>{listing.dealer ? 'Dealer' : 'Owner'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.dealer ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={listing.dealer.logo || undefined} />
                      <AvatarFallback>
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{listing.dealer.businessName}</p>
                      {listing.dealer.verified && (
                        <Badge variant="default" className="text-xs">Verified</Badge>
                      )}
                    </div>
                  </div>
                  <Link href={`/admin/dealers/${listing.dealer.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Dealer Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={listing.user?.avatar || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {listing.user?.firstName} {listing.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{listing.user?.email}</p>
                    </div>
                  </div>
                  <Link href={`/admin/users/${listing.userId}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View User Profile
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {(listing.city || listing.province) && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {listing.city && listing.province
                      ? `${listing.city}, ${listing.province}`
                      : listing.city || listing.province}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Views</span>
                <span className="font-semibold">{listing.views || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saves</span>
                <span className="font-semibold">{listing.saves || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inquiries</span>
                <span className="font-semibold">{listing.inquiries || 0}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-semibold">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>
              {listing.publishedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="text-sm font-semibold">
                    {new Date(listing.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this listing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate(rejectReason || undefined)}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Listing Status</DialogTitle>
            <DialogDescription>
              Update the status of this listing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus || listing.status} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateStatusMutation.mutate(newStatus || listing.status)}
              disabled={updateStatusMutation.isPending || !newStatus || newStatus === listing.status}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

