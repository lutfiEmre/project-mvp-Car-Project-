'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
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

const listings = [
  {
    id: '1',
    title: '2024 BMW M4 Competition',
    price: 98900,
    status: 'active',
    views: 1250,
    saves: 89,
    inquiries: 12,
    createdAt: '2024-01-15',
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=200&q=80',
  },
  {
    id: '2',
    title: '2023 Mercedes-Benz GLE 450',
    price: 82500,
    status: 'active',
    views: 890,
    saves: 67,
    inquiries: 8,
    createdAt: '2024-01-10',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=200&q=80',
  },
  {
    id: '3',
    title: '2024 Tesla Model Y',
    price: 67990,
    status: 'pending',
    views: 0,
    saves: 0,
    inquiries: 0,
    createdAt: '2024-01-20',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=200&q=80',
  },
  {
    id: '4',
    title: '2022 Toyota RAV4 Hybrid',
    price: 42500,
    status: 'sold',
    views: 2450,
    saves: 134,
    inquiries: 28,
    createdAt: '2023-12-05',
    image: 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=200&q=80',
  },
];

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500',
  pending: 'bg-amber-500',
  sold: 'bg-blue-500',
  expired: 'bg-slate-500',
  rejected: 'bg-red-500',
};

export default function MyListingsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your vehicle listings
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search listings..." className="pl-9" />
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
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
              >
                <div className="relative h-20 w-32 overflow-hidden rounded-lg shrink-0">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{listing.title}</h3>
                    <Badge
                      variant="secondary"
                      className={`${statusColors[listing.status]} text-white`}
                    >
                      {listing.status}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-primary mt-1">
                    {formatPrice(listing.price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Listed on {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{listing.views}</p>
                    <p>Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{listing.saves}</p>
                    <p>Saves</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{listing.inquiries}</p>
                    <p>Inquiries</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Eye className="h-4 w-4" />
                      View Listing
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

