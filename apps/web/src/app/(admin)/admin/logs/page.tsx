'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter,
  User,
  Car,
  Settings,
  Shield,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
import { cn } from '@/lib/utils';
import { useActivityLogs } from '@/hooks/use-admin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const typeConfig: Record<string, { color: string; icon: any }> = {
  info: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileText },
  success: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: FileText },
  warning: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: FileText },
  error: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: FileText },
};

const entityIcons: Record<string, any> = {
  Auth: Shield,
  User: User,
  Listing: Car,
  Settings: Settings,
  Dealer: User,
};

// Helper function to determine log type from action
function getLogType(action: string): string {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes('login') || lowerAction.includes('created') || lowerAction.includes('verified')) {
    return 'success';
  }
  if (lowerAction.includes('suspended') || lowerAction.includes('rejected') || lowerAction.includes('failed')) {
    return lowerAction.includes('failed') ? 'error' : 'warning';
  }
  return 'info';
}

export default function AdminLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: logsData, isLoading, error } = useActivityLogs({
    page,
    limit,
    entity: entityFilter !== 'all' ? entityFilter : undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
  });

  // Mock data for demonstration
  const mockLogs = [
    {
      id: '1',
      userId: 'admin-1',
      action: 'User Login',
      entity: 'Auth',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      user: { id: 'admin-1', email: 'test@emrelutfi.com', firstName: 'Admin', lastName: 'User' },
    },
    {
      id: '2',
      userId: 'dealer-1',
      action: 'Listing Created',
      entity: 'Listing',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { id: 'dealer-1', email: 'dealer@carhaus.com', firstName: 'Dealer', lastName: 'User' },
    },
    {
      id: '3',
      userId: 'admin-1',
      action: 'User Suspended',
      entity: 'User',
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      user: { id: 'admin-1', email: 'test@emrelutfi.com', firstName: 'Admin', lastName: 'User' },
    },
    {
      id: '4',
      action: 'Failed Login Attempt',
      entity: 'Auth',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      user: null,
    },
    {
      id: '5',
      userId: 'admin-1',
      action: 'Settings Updated',
      entity: 'Settings',
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      user: { id: 'admin-1', email: 'test@emrelutfi.com', firstName: 'Admin', lastName: 'User' },
    },
    {
      id: '6',
      userId: 'admin-1',
      action: 'Dealer Verified',
      entity: 'Dealer',
      entityId: 'dealer-1',
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      user: { id: 'admin-1', email: 'test@emrelutfi.com', firstName: 'Admin', lastName: 'User' },
    },
    {
      id: '7',
      userId: 'admin-1',
      action: 'Listing Rejected',
      entity: 'Listing',
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      user: { id: 'admin-1', email: 'test@emrelutfi.com', firstName: 'Admin', lastName: 'User' },
    },
    {
      id: '8',
      userId: 'dealer-1',
      action: 'Listing Created',
      entity: 'Listing',
      ipAddress: '192.168.1.4',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { id: 'dealer-1', email: 'dealer@carhaus.com', firstName: 'Dealer', lastName: 'User' },
    },
    {
      id: '9',
      userId: 'admin-1',
      action: 'User Created',
      entity: 'User',
      ipAddress: '192.168.1.3',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      user: { id: 'admin-1', email: 'test@emrelutfi.com', firstName: 'Admin', lastName: 'User' },
    },
    {
      id: '10',
      userId: 'dealer-1',
      action: 'Listing Updated',
      entity: 'Listing',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { id: 'dealer-1', email: 'dealer@carhaus.com', firstName: 'Dealer', lastName: 'User' },
    },
  ];

  // Use mock data if API returns empty or fails
  const logs = (logsData?.data && logsData.data.length > 0) ? logsData.data : mockLogs;
  const totalPages = logsData?.meta?.totalPages || 1;

  const filteredLogs = useMemo(() => {
    let filtered: any[] = logs;

    // Filter by entity
    if (entityFilter !== 'all') {
      filtered = filtered.filter((log: any) => 
        log.entity?.toLowerCase() === entityFilter.toLowerCase()
      );
    }

    // Filter by action (case-insensitive partial match)
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log: any) => 
        log.action?.toLowerCase().includes(actionFilter.toLowerCase())
      );
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((log: any) => 
        log.action?.toLowerCase().includes(search) ||
        log.entity?.toLowerCase().includes(search) ||
        log.user?.email?.toLowerCase().includes(search) ||
        log.ipAddress?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [logs, searchTerm, entityFilter, actionFilter]);

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">
            View all system activity and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                await api.admin.seedActivityLogs();
                window.location.reload();
              } catch (error) {
                console.error('Failed to seed logs:', error);
                alert('Failed to create sample logs');
              }
            }}
          >
            Create Sample Logs
          </Button>
          <Button variant="outline">Export Logs</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={entityFilter} onValueChange={(value) => {
          setEntityFilter(value);
          setPage(1); // Reset to first page when filter changes
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="Auth">Auth</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Listing">Listing</SelectItem>
            <SelectItem value="Dealer">Dealer</SelectItem>
            <SelectItem value="Settings">Settings</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(value) => {
          setActionFilter(value);
          setPage(1); // Reset to first page when filter changes
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="Login">Login</SelectItem>
            <SelectItem value="Created">Created</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Updated">Updated</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-2">Error loading activity logs</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-2">No activity logs found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or create sample logs
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredLogs.map((log: any, index: number) => {
              const logType = getLogType(log.action);
              const typeStyle = typeConfig[logType] || typeConfig.info;
              const EntityIcon = entityIcons[log.entity] || FileText;
              const userName = log.user?.email || 'Unknown';
              const formattedDate = new Date(log.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', typeStyle.color)}>
                      <EntityIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{log.action}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', typeStyle.color)}>
                          {logType}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Entity: {log.entity}</span>
                        <span>User: {userName}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground shrink-0">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formattedDate}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredLogs.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({logsData?.meta?.total || 0} total logs)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

