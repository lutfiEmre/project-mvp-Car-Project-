'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice } from '@/lib/utils';
import { useMyListings } from '@/hooks/use-listings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function MyListingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('dashboard');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: myListingsData, isLoading, error } = useMyListings();

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500',
    PENDING_APPROVAL: 'bg-amber-500',
    SOLD: 'bg-blue-500',
    EXPIRED: 'bg-slate-500',
    REJECTED: 'bg-red-500',
    INACTIVE: 'bg-slate-400',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: t('active'),
    PENDING_APPROVAL: t('pending'),
    SOLD: t('sold'),
    EXPIRED: t('expired'),
    REJECTED: t('rejected'),
    INACTIVE: t('inactive'),
  };

  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.delete(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'my'] });
      toast.success(t('listingDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('failedToDelete'));
    },
  });

  const listings = Array.isArray(myListingsData) 
    ? myListingsData 
    : (myListingsData?.data || []);

  const filteredListings = listings.filter((listing: any) => {
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.model?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleDelete = async (listingId: string) => {
    if (window.confirm(t('deleteConfirm'))) {
      await deleteMutation.mutateAsync(listingId);
    }
  };

  const handleViewListing = (listing: any) => {
    if (listing.slug) {
      router.push(`/vehicles/${listing.slug}`);
    } else {
      toast.error(t('listingSlugNotAvailable'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('myListings')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('manageListings')}
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newListing')}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={t('searchListings')} 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="ACTIVE">{t('active')}</SelectItem>
                <SelectItem value="PENDING_APPROVAL">{t('pending')}</SelectItem>
                <SelectItem value="SOLD">{t('sold')}</SelectItem>
                <SelectItem value="EXPIRED">{t('expired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">{t('errorLoadingListings')}</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? t('noListingsMatch') || 'No listings match your search'
                  : t('noListingsYet')}
              </p>
              <Link href="/dashboard/listings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createFirstListing')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredListings.map((listing: any, index: number) => {
                const status = listing.status || 'ACTIVE';
                const title = listing.title || 
                  `${listing.year || ''} ${listing.make || ''} ${listing.model || ''}`.trim() ||
                  t('untitledListing');
                const firstMedia = listing.media?.[0];
                const imageUrl = firstMedia?.url || 
                  (typeof firstMedia === 'string' ? firstMedia : '/placeholder-car.jpg');
                
                return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="relative h-20 w-32 overflow-hidden rounded-lg shrink-0">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-car.jpg';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{title}</h3>
                      <Badge
                        variant="secondary"
                        className={`${statusColors[status]} text-white`}
                      >
                        {statusLabels[status] || status}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatPrice(listing.price || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('listedOn')} {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{listing.views || 0}</p>
                      <p>{t('views')}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{listing.saves || 0}</p>
                      <p>{t('saves')}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{listing.inquiries || 0}</p>
                      <p>{t('inquiries')}</p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={() => handleViewListing(listing)}
                      >
                        <Eye className="h-4 w-4" />
                        {t('viewListing')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={() => router.push(`/dashboard/listings/${listing.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => handleDelete(listing.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

