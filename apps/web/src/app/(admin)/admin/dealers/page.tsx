'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MapPin,
  Car,
  Loader2,
  MessageCircle,
  Mail,
  Phone,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn, formatNumber, formatDate, formatPrice } from '@/lib/utils';
import { useAdminDealers, useVerifyDealer, useSuspendDealer } from '@/hooks/use-admin';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const dealers = [
  { id: '1', name: 'Premium Auto Gallery', location: 'Toronto, ON', verified: true, rating: 4.8, listings: 45, status: 'active' },
  { id: '2', name: 'Pacific Motors', location: 'Vancouver, BC', verified: true, rating: 4.9, listings: 78, status: 'active' },
  { id: '3', name: 'Prairie Auto Group', location: 'Calgary, AB', verified: false, rating: 0, listings: 0, status: 'pending' },
  { id: '4', name: 'Montreal Luxury Cars', location: 'Montreal, QC', verified: true, rating: 4.5, listings: 32, status: 'active' },
  { id: '5', name: 'Atlantic Auto', location: 'Halifax, NS', verified: false, rating: 0, listings: 0, status: 'rejected' },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminDealersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<any | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [inquiriesStatusFilter, setInquiriesStatusFilter] = useState('all');
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('PROFESSIONAL');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const queryClient = useQueryClient();
  const { data: dealersData, isLoading } = useAdminDealers({ limit: 50 });
  const verifyDealer = useVerifyDealer();
  const suspendDealer = useSuspendDealer();
  
  const { data: subscriptionsData } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => api.admin.getAllSubscriptions(),
  });

  const { data: plansData } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => api.admin.getPlans(),
  });
  
  const unverifyDealer = useMutation({
    mutationFn: (id: string) => api.admin.unverifyDealer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dealers'] });
      toast.success('Dealer verification removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unverify dealer');
    },
  });

  const dealers = dealersData?.data || [];

  // Fetch inquiries for selected dealer
  const { data: inquiriesData, isLoading: isLoadingInquiries } = useQuery({
    queryKey: ['admin', 'dealer', 'inquiries', selectedDealer?.id, inquiriesStatusFilter],
    queryFn: async () => {
      if (!selectedDealer?.id) return null;
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/dealers/${selectedDealer.id}/inquiries?status=${inquiriesStatusFilter === 'all' ? '' : inquiriesStatusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
    enabled: !!selectedDealer?.id,
  });

  const inquiries = inquiriesData?.data || [];

  // Fetch selected inquiry details
  const { data: inquiryDetail } = useQuery({
    queryKey: ['admin', 'inquiry', selectedInquiry?.id],
    queryFn: async () => {
      if (!selectedInquiry?.id) return null;
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/inquiries/${selectedInquiry.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch inquiry');
      return response.json();
    },
    enabled: !!selectedInquiry?.id,
  });

  const subscriptionsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (subscriptionsData || []).forEach((sub: any) => {
      const dealerId = sub.dealer?.id;
      if (dealerId) {
        // Prefer ACTIVE subscriptions, but if none exist, use the most recent one
        if (!map[dealerId] || sub.status === 'ACTIVE' || (map[dealerId].status !== 'ACTIVE' && new Date(sub.createdAt) > new Date(map[dealerId].createdAt))) {
          map[dealerId] = sub;
        }
      }
    });
    return map;
  }, [subscriptionsData]);

  const upgradeSubscriptionMutation = useMutation({
    mutationFn: ({ dealerId, plan, billingCycle }: { dealerId: string; plan: string; billingCycle: 'monthly' | 'yearly' }) =>
      api.admin.upgradeDealerSubscription(dealerId, plan, billingCycle),
    onSuccess: async () => {
      toast.success('Subscription updated successfully');
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['admin', 'subscriptions'] }),
        queryClient.refetchQueries({ queryKey: ['admin', 'dealers'] }),
      ]);
      setUpgradeDialogOpen(false);
      setSelectedDealer(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update subscription');
    },
  });

  const handleUpgradeSubscription = () => {
    if (!selectedDealer) return;
    upgradeSubscriptionMutation.mutate({
      dealerId: selectedDealer.id,
      plan: selectedPlan,
      billingCycle: selectedBillingCycle,
    });
  };

  const filteredDealers = dealers.filter((dealer: any) => {
    const matchesSearch = dealer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dealer.user?.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesVerified = verifiedFilter === 'all' || 
      (verifiedFilter === 'verified' && dealer.verified) ||
      (verifiedFilter === 'unverified' && !dealer.verified);
    return matchesSearch && matchesStatus && matchesVerified;
  });

  const handleVerifyDealer = async (id: string) => {
    try {
      await verifyDealer.mutateAsync(id);
      toast.success('Dealer verified successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify dealer');
    }
  };

  const handleSuspendDealer = async () => {
    if (!selectedDealer) return;
    try {
      await suspendDealer.mutateAsync(selectedDealer.id);
      toast.success('Dealer suspended successfully');
      setSuspendDialogOpen(false);
      setSelectedDealer(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend dealer');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Dealers</h1>
        <p className="text-muted-foreground">
          Manage dealership accounts and verifications
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Dealers', value: formatNumber(dealers.length), icon: Building2 },
          { label: 'Verified', value: formatNumber(dealers.filter((d: any) => d.verified).length), icon: CheckCircle },
          { label: 'Pending', value: formatNumber(dealers.filter((d: any) => d.user?.status === 'PENDING').length), icon: Clock },
          { label: 'Total Listings', value: formatNumber(dealers.reduce((sum: number, d: any) => sum + (d._count?.listings || 0), 0)), icon: Car },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search dealers..."
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
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Verified" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dealers Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDealers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold">No dealers found</p>
            <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Dealer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Verified</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Listings</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDealers.map((dealer: any, index: number) => {
                  const userStatus = dealer.user?.status || 'active';
                  const status = statusConfig[userStatus as keyof typeof statusConfig] || statusConfig.active;
                  const location = dealer.city && dealer.province ? `${dealer.city}, ${dealer.province}` : 'N/A';
                  
                  return (
                    <motion.tr
                      key={dealer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {dealer.businessName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'DE'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{dealer.businessName || 'N/A'}</p>
                              {dealer.verified && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{dealer.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {location}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', status.color)}>
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {dealer.verified ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {subscriptionsMap[dealer.id] ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={subscriptionsMap[dealer.id].plan === 'FREE' ? 'secondary' : 'default'}>
                              {subscriptionsMap[dealer.id].plan}
                            </Badge>
                            {subscriptionsMap[dealer.id].status === 'ACTIVE' ? (
                              <Badge variant="outline" className="text-green-600 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 text-xs">
                                {subscriptionsMap[dealer.id].status}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary">No Subscription</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">{dealer._count?.listings || 0}</td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedDealer(dealer);
                              setViewDialogOpen(true);
                              setSelectedInquiry(null);
                            }}>
                              View Details & Messages
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dealers/${dealer.slug || dealer.id}`}>
                                View Listings
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedDealer(dealer);
                              if (subscriptionsMap[dealer.id]) {
                                setSelectedPlan(subscriptionsMap[dealer.id].plan);
                                setSelectedBillingCycle(subscriptionsMap[dealer.id].billingCycle || 'monthly');
                              }
                              setUpgradeDialogOpen(true);
                            }}>
                              <Package className="mr-2 h-4 w-4" />
                              Manage Subscription
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!dealer.verified ? (
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => handleVerifyDealer(dealer.id)}
                                disabled={verifyDealer.isPending}
                              >
                                {verifyDealer.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Verify Dealer
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="text-amber-600"
                                onClick={() => unverifyDealer.mutate(dealer.id)}
                                disabled={unverifyDealer.isPending}
                              >
                                {unverifyDealer.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Remove Verification
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedDealer(dealer);
                                setSuspendDialogOpen(true);
                              }}
                            >
                              Suspend Dealer
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

      {/* View Dealer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedDealer?.businessName || 'Dealer Details'}</DialogTitle>
            <DialogDescription>
              View dealer information and messages
            </DialogDescription>
          </DialogHeader>
          {selectedDealer && (
            <div className="flex-1 overflow-hidden flex gap-6">
              {/* Left Side - Dealer Info */}
              <div className="w-1/3 border-r pr-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{selectedDealer.businessName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDealer.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedDealer.city && selectedDealer.province ? `${selectedDealer.city}, ${selectedDealer.province}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="font-medium">{selectedDealer.verified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', 
                      statusConfig[selectedDealer.user?.status as keyof typeof statusConfig]?.color || statusConfig.active.color
                    )}>
                      {statusConfig[selectedDealer.user?.status as keyof typeof statusConfig]?.label || 'Active'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Listings</p>
                    <p className="font-medium">{selectedDealer._count?.listings || 0}</p>
                  </div>
                </div>
              </div>

              {/* Right Side - Messages */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Messages ({inquiries.length})
                    </h3>
                    <Select value={inquiriesStatusFilter} onValueChange={setInquiriesStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="READ">Read</SelectItem>
                        <SelectItem value="REPLIED">Replied</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex gap-4">
                  {/* Messages List */}
                  <div className="w-1/2 border-r pr-4 overflow-y-auto">
                    {isLoadingInquiries ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : inquiries.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No messages</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {inquiries.map((inquiry: any) => (
                          <button
                            key={inquiry.id}
                            onClick={() => setSelectedInquiry(inquiry)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedInquiry?.id === inquiry.id
                                ? 'bg-slate-50 dark:bg-slate-800/50 border-primary'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            } ${inquiry.status === 'NEW' ? 'border-l-4 border-l-primary' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="relative h-10 w-14 rounded overflow-hidden shrink-0">
                                {inquiry.listing?.media?.[0]?.url ? (
                                  <Image
                                    src={inquiry.listing.media[0].url}
                                    alt={inquiry.listing.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                                    <Car className="h-5 w-5 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-sm truncate">{inquiry.name}</p>
                                  {inquiry.status === 'NEW' && (
                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {inquiry.listing?.title || `${inquiry.listing?.year} ${inquiry.listing?.make} ${inquiry.listing?.model}`}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(inquiry.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Detail */}
                  <div className="flex-1 overflow-y-auto">
                    {selectedInquiry && inquiryDetail ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{inquiryDetail.name}</h4>
                            <Badge
                              variant={
                                inquiryDetail.status === 'NEW'
                                  ? 'default'
                                  : inquiryDetail.status === 'REPLIED'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {inquiryDetail.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {inquiryDetail.email}
                            </p>
                            {inquiryDetail.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {inquiryDetail.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {inquiryDetail.listing && (
                          <div className="rounded-lg border p-3 bg-muted/50">
                            <div className="flex items-center gap-3">
                              {inquiryDetail.listing.media?.[0]?.url && (
                                <div className="relative h-16 w-24 rounded overflow-hidden shrink-0">
                                  <Image
                                    src={inquiryDetail.listing.media[0].url}
                                    alt={inquiryDetail.listing.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <Link
                                  href={`/vehicles/${inquiryDetail.listing.slug}`}
                                  className="font-medium text-sm hover:text-primary transition-colors"
                                >
                                  {inquiryDetail.listing.title ||
                                    `${inquiryDetail.listing.year} ${inquiryDetail.listing.make} ${inquiryDetail.listing.model}`}
                                </Link>
                                <p className="text-sm font-semibold text-primary mt-1">
                                  {formatPrice(inquiryDetail.listing.price)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium mb-2">Message</p>
                          <div className="rounded-lg border p-3 bg-muted/30">
                            <p className="text-sm whitespace-pre-wrap">{inquiryDetail.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(inquiryDetail.createdAt)}
                          </p>
                        </div>

                        {inquiryDetail.reply && (
                          <div>
                            <p className="text-sm font-medium mb-2">Reply</p>
                            <div className="rounded-lg border p-3 bg-primary/5">
                              <p className="text-sm whitespace-pre-wrap">{inquiryDetail.reply}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Replied {formatDate(inquiryDetail.repliedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : selectedInquiry ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Select a message to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setViewDialogOpen(false);
              setSelectedDealer(null);
              setSelectedInquiry(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dealer Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Dealer</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend this dealer? They will not be able to access their account.
            </DialogDescription>
          </DialogHeader>
          {selectedDealer && (
            <div className="py-4">
              <p className="font-medium">{selectedDealer.businessName || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{selectedDealer.user?.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSuspendDialogOpen(false);
              setSelectedDealer(null);
            }}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleSuspendDealer}
              disabled={suspendDealer.isPending}
            >
              {suspendDealer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Suspend Dealer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update dealer subscription plan without payment (admin only)
            </DialogDescription>
          </DialogHeader>
          {selectedDealer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedDealer.businessName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'DE'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedDealer.businessName || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedDealer.user?.email}</p>
                </div>
              </div>
              {subscriptionsMap[selectedDealer.id] && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={subscriptionsMap[selectedDealer.id].plan === 'FREE' ? 'secondary' : 'default'}>
                      {subscriptionsMap[selectedDealer.id].plan}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {subscriptionsMap[selectedDealer.id].billingCycle || 'monthly'}
                    </Badge>
                    {subscriptionsMap[selectedDealer.id].status === 'ACTIVE' && (
                      <Badge variant="outline" className="text-green-600 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label>Select Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                {plansData && plansData[selectedPlan] && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPrice(plansData[selectedPlan].price)}/{selectedBillingCycle === 'monthly' ? 'mo' : 'yr'}
                  </p>
                )}
              </div>
              <div>
                <Label>Billing Cycle</Label>
                <Select value={selectedBillingCycle} onValueChange={(value) => setSelectedBillingCycle(value as 'monthly' | 'yearly')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUpgradeDialogOpen(false);
              setSelectedDealer(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpgradeSubscription}
              disabled={upgradeSubscriptionMutation.isPending || !selectedDealer}
            >
              {upgradeSubscriptionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

