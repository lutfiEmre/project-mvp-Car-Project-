'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Check,
  X,
  Eye,
  Building2,
  Car,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { usePendingListings, useApproveListing, useRejectListing, useVerifyDealer, usePendingDealers } from '@/hooks/use-admin';
import { formatPrice, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

export default function ApprovalsPage() {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: pendingListingsData, isLoading: listingsLoading } = usePendingListings({ limit: 50 });
  const { data: pendingDealersData, isLoading: dealersLoading } = usePendingDealers({ limit: 50 });
  const approveListing = useApproveListing();
  const rejectListing = useRejectListing();
  const verifyDealer = useVerifyDealer();

  const pendingListings = pendingListingsData?.data || [];
  const pendingDealers = pendingDealersData?.data || [];

  const filteredListings = pendingListings.filter((listing: any) =>
    listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.dealer?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveListing = async (id: string) => {
    try {
      await approveListing.mutateAsync(id);
      toast.success('Listing approved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve listing');
    }
  };

  const handleRejectListing = async () => {
    if (!selectedItem) return;
    try {
      await rejectListing.mutateAsync({ id: selectedItem.id, reason: rejectReason });
      toast.success('Listing rejected');
      setRejectDialogOpen(false);
      setSelectedItem(null);
      setRejectReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject listing');
    }
  };

  const handleVerifyDealer = async (id: string) => {
    try {
      await verifyDealer.mutateAsync(id);
      toast.success('Dealer verified successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify dealer');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve listings and dealer registrations
        </p>
      </div>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings" className="gap-2">
            <Car className="h-4 w-4" />
            Listings
            <Badge variant="secondary">{pendingListings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="dealers" className="gap-2">
            <Building2 className="h-4 w-4" />
            Dealers
            <Badge variant="secondary">{pendingDealers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Listings</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search listings..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg font-semibold">No pending listings</p>
                  <p className="text-muted-foreground mt-2">All listings have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredListings.map((listing: any, index: number) => {
                    const dealerName = listing.dealer?.businessName || listing.user?.firstName + ' ' + listing.user?.lastName || 'Unknown';
                    const location = listing.city && listing.province ? `${listing.city}, ${listing.province}` : 'N/A';
                    const imageUrl = listing.media?.[0]?.url || 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=200&q=80';
                    const submittedTime = listing.createdAt ? new Date(listing.createdAt).toLocaleString() : 'Unknown';

                    return (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 rounded-xl border bg-card p-4"
                      >
                        <div className="relative h-20 w-32 overflow-hidden rounded-lg shrink-0">
                          <img
                            src={imageUrl}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{listing.title}</h3>
                          <p className="text-lg font-bold text-primary">{formatPrice(listing.price)}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{dealerName}</span>
                            <span>{location}</span>
                            <span>{submittedTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-1"
                            onClick={() => {
                              setSelectedItem(listing);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleApproveListing(listing.id)}
                            disabled={approveListing.isPending}
                          >
                            {approveListing.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-500 hover:text-red-600"
                            onClick={() => {
                              setSelectedItem(listing);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dealers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Dealer Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {dealersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pendingDealers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg font-semibold">No pending dealers</p>
                  <p className="text-muted-foreground mt-2">All dealer registrations have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDealers.map((dealer: any, index: number) => {
                    const businessName = dealer.businessName || 'Unknown Business';
                    const user = dealer.user || {};
                    const email = user.email || 'N/A';
                    const location = dealer.city && dealer.province ? `${dealer.city}, ${dealer.province}` : dealer.city || dealer.province || 'N/A';
                    const submittedTime = dealer.createdAt ? new Date(dealer.createdAt).toLocaleString() : 'Unknown';
                    const listingsCount = dealer._count?.listings || 0;

                    return (
                      <motion.div
                        key={dealer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 rounded-xl border bg-card p-4"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{businessName}</h3>
                          <p className="text-sm text-muted-foreground">{email}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{location}</span>
                            <span>{listingsCount} listing{listingsCount !== 1 ? 's' : ''}</span>
                            <span>{submittedTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleVerifyDealer(dealer.id)}
                            disabled={verifyDealer.isPending}
                          >
                            {verifyDealer.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Verify
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listing Preview</DialogTitle>
            <DialogDescription>
              Review listing details before approval
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedItem.title}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">{formatPrice(selectedItem.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="mt-1">{selectedItem.status}</Badge>
                </div>
              </div>
              {selectedItem.media?.[0]?.url && (
                <img 
                  src={selectedItem.media[0].url} 
                  alt={selectedItem.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Dealer/Seller</p>
                  <p className="font-medium">{selectedItem.dealer?.businessName || selectedItem.user?.firstName + ' ' + selectedItem.user?.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedItem.city}, {selectedItem.province}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="font-medium">{selectedItem.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mileage</p>
                  <p className="font-medium">{formatNumber(selectedItem.mileage)} km</p>
                </div>
              </div>
              {selectedItem.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => {
                if (selectedItem) {
                  handleApproveListing(selectedItem.id);
                  setPreviewDialogOpen(false);
                }
              }}
            >
              Approve Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              setSelectedItem(null);
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
    </div>
  );
}

