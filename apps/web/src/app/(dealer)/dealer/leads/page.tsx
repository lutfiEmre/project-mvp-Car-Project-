'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

const getStatusConfig = (t: any) => ({
  NEW: { label: t('new'), color: 'bg-blue-100 text-blue-700', icon: Clock },
  READ: { label: t('read'), color: 'bg-yellow-100 text-yellow-700', icon: MessageSquare },
  REPLIED: { label: t('replied'), color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ARCHIVED: { label: t('archived'), color: 'bg-gray-100 text-gray-700', icon: XCircle },
});

export default function LeadsPage() {
  const t = useTranslations('dealer.leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['dealer', 'inquiries', 'leads'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/inquiries`,
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
    refetchInterval: 30000,
  });

  const leads = inquiriesData?.data || [];

  const filteredLeads = leads.filter((lead: any) => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSearch = searchTerm === '' ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.listing?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l: any) => l.status === 'NEW').length,
    contacted: leads.filter((l: any) => l.status === 'READ').length,
    converted: leads.filter((l: any) => l.status === 'REPLIED').length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: t('totalLeads'), value: stats.total.toString(), icon: Users },
          { label: t('newToday'), value: stats.new.toString(), icon: Clock },
          { label: t('contacted'), value: stats.contacted.toString(), icon: MessageSquare },
          { label: t('converted'), value: stats.converted.toString(), icon: CheckCircle },
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

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchLeads')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            <SelectItem value="NEW">{t('new')}</SelectItem>
            <SelectItem value="READ">{t('read')}</SelectItem>
            <SelectItem value="REPLIED">{t('replied')}</SelectItem>
            <SelectItem value="ARCHIVED">{t('archived')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-12 rounded-xl border bg-card">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? t('noLeadsMatch')
              : t('noLeadsYet')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('leadsWillAppear')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead: any, index: number) => {
            const statusConfig = getStatusConfig(t);
            const status = statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.NEW;
            const vehicleTitle = lead.listing?.title || 
              `${lead.listing?.year || ''} ${lead.listing?.make || ''} ${lead.listing?.model || ''}`.trim() ||
              'Unknown Vehicle';
            
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border bg-card p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback>
                      {lead.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{lead.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('interestedIn')} {vehicleTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                          status.color
                        )}>
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href="/dealer/messages" className="cursor-pointer">
                                {t('viewDetails')}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {lead.message || t('noMessage')}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {lead.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <a href={`mailto:${lead.email}`}>
                        <Button size="sm" className="gap-2">
                          <Mail className="h-4 w-4" />
                          {t('email')}
                        </Button>
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`}>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Phone className="h-4 w-4" />
                            {t('call')}
                          </Button>
                        </a>
                      )}
                      <Link href="/dealer/messages">
                        <Button size="sm" variant="outline" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          {t('reply')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

