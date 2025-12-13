'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  MoreVertical,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  Clock,
  UserX,
  Loader2,
  Eye,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatNumber } from '@/lib/utils';
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/use-admin';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', icon: Ban },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700', icon: Ban },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

const roleConfig = {
  USER: { label: 'User', color: 'bg-blue-100 text-blue-700' },
  DEALER: { label: 'Dealer', color: 'bg-purple-100 text-purple-700' },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700' },
};

// Fallback data
const fallbackUsers = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john@example.com', role: 'USER', status: 'active', createdAt: '2024-01-15', _count: { listings: 3 } },
  { id: '2', firstName: 'Emily', lastName: 'Davis', email: 'emily@example.com', role: 'DEALER', status: 'active', createdAt: '2024-01-10', _count: { listings: 45 } },
  { id: '3', firstName: 'Michael', lastName: 'Brown', email: 'michael@example.com', role: 'USER', status: 'suspended', createdAt: '2023-12-20', _count: { listings: 0 } },
  { id: '4', firstName: 'Sarah', lastName: 'Wilson', email: 'sarah@example.com', role: 'ADMIN', status: 'active', createdAt: '2023-11-01', _count: { listings: 0 } },
  { id: '5', firstName: 'David', lastName: 'Lee', email: 'david@example.com', role: 'USER', status: 'pending', createdAt: '2024-01-18', _count: { listings: 0 } },
];

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const { data: usersData, isLoading } = useAdminUsers({ limit: 50 });
  const updateUserStatus = useUpdateUserStatus();

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUserStatus.mutateAsync({ id: selectedUser.id, status: 'SUSPENDED' });
      toast.success('User suspended successfully');
      setSuspendDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await updateUserStatus.mutateAsync({ id: userId, status: 'ACTIVE' });
      toast.success('User activated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate user');
    }
  };

  const users = useMemo(() => {
    let items: any[] = usersData?.data || fallbackUsers;
    
    // Filter by search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      items = items.filter((user: any) => 
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      items = items.filter((user: any) => 
        user.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      items = items.filter((user: any) => 
        user.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    return items;
  }, [usersData, searchTerm, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const items = usersData?.data || fallbackUsers;
    return {
      total: items.length,
      active: items.filter((u: any) => u.status === 'active' || u.status === 'ACTIVE').length,
      dealers: items.filter((u: any) => u.role === 'DEALER').length,
      suspended: items.filter((u: any) => u.status === 'suspended' || u.status === 'SUSPENDED').length,
    };
  }, [usersData]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage all users on the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Users', value: stats.total, icon: Users },
          { label: 'Active', value: stats.active, icon: CheckCircle },
          { label: 'Dealers', value: stats.dealers, icon: Shield },
          { label: 'Suspended', value: stats.suspended, icon: UserX },
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
                <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
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
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="dealer">Dealers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold">No users found</p>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Listings</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user: any, index: number) => {
                  const status = statusConfig[user.status as keyof typeof statusConfig] || statusConfig.active;
                  const role = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.USER;
                  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                  
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('rounded-full px-2 py-1 text-xs font-medium', role.color)}>
                          {role.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', status.color)}>
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm">{user._count?.listings || 0}</td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setViewDialogOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `mailto:${user.email}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status !== 'SUSPENDED' && user.status !== 'suspended' ? (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSuspendDialogOpen(true);
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
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

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', 
                    statusConfig[selectedUser.status as keyof typeof statusConfig]?.color || statusConfig.active.color
                  )}>
                    {statusConfig[selectedUser.status as keyof typeof statusConfig]?.label || 'Active'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Listings</p>
                  <p className="font-medium">{selectedUser._count?.listings || 0}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend this user? They will not be able to access their account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p className="font-medium">{`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}</p>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSuspendDialogOpen(false);
              setSelectedUser(null);
            }}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleSuspendUser}
              disabled={updateUserStatus.isPending}
            >
              {updateUserStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
