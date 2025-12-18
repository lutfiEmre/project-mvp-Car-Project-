'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Search, 
  Download,
  Calendar,
  Building2,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatPrice, formatNumber } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusConfig = {
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: XCircle },
};

export default function AdminPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dealerFilter, setDealerFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['admin', 'payments', currentPage, statusFilter, dealerFilter],
    queryFn: () => api.admin.getAllPayments({
      page: currentPage,
      limit: 20,
      dealerId: dealerFilter !== 'all' ? dealerFilter : undefined,
    }),
  });

  const payments = useMemo(() => {
    let items = paymentsData?.data || [];
    
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      items = items.filter((payment: any) => 
        payment.invoiceNumber?.toLowerCase().includes(query) ||
        payment.dealer?.businessName?.toLowerCase().includes(query) ||
        payment.dealer?.user?.email?.toLowerCase().includes(query) ||
        payment.transactionId?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      items = items.filter((payment: any) => 
        payment.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    return items;
  }, [paymentsData, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const items = paymentsData?.data || [];
    const totalRevenue = items
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    
    return {
      total: items.length,
      completed: items.filter((p: any) => p.status === 'COMPLETED').length,
      pending: items.filter((p: any) => p.status === 'PENDING').length,
      failed: items.filter((p: any) => p.status === 'FAILED').length,
      totalRevenue,
    };
  }, [paymentsData]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">
          View and manage all payments on the platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Payments', value: stats.total, icon: FileText, color: 'text-blue-500' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center")}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{typeof stat.value === 'string' ? stat.value : formatNumber(stat.value)}</p>
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
            placeholder="Search by invoice, dealer, or transaction ID..."
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No payments found</p>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Invoice</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Dealer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Transaction ID</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment: any, index: number) => {
                  const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.PENDING;
                  
                  return (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{payment.invoiceNumber || payment.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{payment.dealer?.businessName || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{payment.dealer?.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {formatPrice(Number(payment.amount))}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', status.color)}>
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {payment.subscription?.plan || 'N/A'}
                        {payment.subscription?.billingCycle && (
                          <span className="text-muted-foreground ml-1">
                            ({payment.subscription.billingCycle})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        {payment.paidAt && (
                          <div className="text-xs mt-1">
                            Paid: {new Date(payment.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payment.transactionId?.slice(0, 20) || 'N/A'}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.open(`/admin/payments/${payment.id}`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {paymentsData?.meta && paymentsData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, paymentsData.meta.total)} of {paymentsData.meta.total} payments
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= paymentsData.meta.totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

