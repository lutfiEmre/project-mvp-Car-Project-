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
  Trash2,
  UserCog,
  AlertTriangle,
  Car,
  Calendar,
  Activity,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { cn, formatNumber, formatPrice } from '@/lib/utils';
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/use-admin';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Ban },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Ban },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: UserX },
};

const roleConfig = {
  USER: { label: 'User', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  DEALER: { label: 'Dealer', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const suspendReasons = [
  { value: 'spam', label: 'Spam or misleading content' },
  { value: 'fraud', label: 'Fraudulent activity' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'fake_listings', label: 'Fake or misleading listings' },
  { value: 'payment_fraud', label: 'Payment fraud' },
  { value: 'terms_violation', label: 'Terms of service violation' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
];

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('PROFESSIONAL');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendNote, setSuspendNote] = useState('');
  const [newRole, setNewRole] = useState('');
  
  const queryClient = useQueryClient();
  
  const { data: usersData, isLoading } = useAdminUsers({ 
    page: currentPage, 
    limit: 20,
    role: roleFilter !== 'all' ? roleFilter.toUpperCase() : undefined,
  } as any);
  
  const { data: detailedUser, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['admin', 'user', selectedUser?.id],
    queryFn: () => api.admin.getUserById(selectedUser?.id),
    enabled: !!selectedUser?.id && viewDialogOpen,
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => api.admin.getAllSubscriptions(),
  });

  const { data: plansData } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => api.admin.getPlans(),
  });

  const subscriptionsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (subscriptionsData || []).forEach((sub: any) => {
      const userId = sub.dealer?.userId || sub.user?.id;
      if (userId && sub.status === 'ACTIVE') {
        // Only show ACTIVE subscriptions
        if (!map[userId] || new Date(sub.createdAt) > new Date(map[userId].createdAt)) {
          map[userId] = sub;
        }
      }
    });
    return map;
  }, [subscriptionsData]);

  const upgradeSubscriptionMutation = useMutation({
    mutationFn: ({ dealerId, userId, plan, billingCycle }: { dealerId: string | null; userId: string | null; plan: string; billingCycle: 'monthly' | 'yearly' }) => {
      if (dealerId) {
        return api.admin.upgradeDealerSubscription(dealerId, plan, billingCycle);
      } else if (userId) {
        return api.admin.upgradeUserSubscription(userId, plan, billingCycle);
      }
      throw new Error('Either dealerId or userId must be provided');
    },
    onSuccess: async () => {
      toast.success('Subscription updated successfully');
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['admin', 'subscriptions'] }),
        queryClient.refetchQueries({ queryKey: ['admin', 'users'] }),
      ]);
      setUpgradeDialogOpen(false);
      setSelectedUser(null);
      setSelectedDealerId(null);
    },
    onError: (error: any) => {
      console.error('Subscription update error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update subscription';
      toast.error(errorMessage);
    },
  });

  const handleUpgradeSubscription = () => {
    if (!selectedUser) {
      console.error('No user selected');
      return;
    }
    
    console.log('Upgrading subscription for user:', selectedUser.id, 'role:', selectedUser.role, 'plan:', selectedPlan);
    
    if (selectedUser.role === 'DEALER') {
      let dealerId = selectedDealerId;
      
      if (!dealerId) {
        if (selectedUser.dealer?.id) {
          dealerId = selectedUser.dealer.id;
        } else {
          const dealer = users.find((u: any) => u.id === selectedUser.id && u.role === 'DEALER');
          if (!dealer || !dealer.dealer?.id) {
            toast.error('Dealer information not found');
            return;
          }
          dealerId = dealer.dealer.id;
        }
      }
      
      if (!dealerId) {
        toast.error('Dealer ID not found');
        return;
      }
      
      upgradeSubscriptionMutation.mutate({
        dealerId,
        userId: null,
        plan: selectedPlan,
        billingCycle: selectedBillingCycle,
      });
    } else if (selectedUser.role === 'USER') {
      console.log('Calling upgradeUserSubscription with:', {
        userId: selectedUser.id,
        plan: selectedPlan,
        billingCycle: selectedBillingCycle,
      });
      upgradeSubscriptionMutation.mutate({
        dealerId: null,
        userId: selectedUser.id,
        plan: selectedPlan,
        billingCycle: selectedBillingCycle,
      });
    } else {
      toast.error('Subscription management is only available for Users and Dealers');
    }
  };
  
  const updateUserStatus = useUpdateUserStatus();
  
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => 
      api.admin.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated successfully');
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
  
  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      api.admin.suspendUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User suspended successfully');
      setSuspendDialogOpen(false);
      setSelectedUser(null);
      setSuspendReason('');
      setSuspendNote('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend user');
    },
  });
  
  const activateMutation = useMutation({
    mutationFn: (id: string) => api.admin.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User activated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate user');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const users = useMemo(() => {
    let items: any[] = usersData?.data || [];
    
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      items = items.filter((user: any) => 
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [usersData, searchTerm]);

  const stats = useMemo(() => {
    const meta = usersData?.meta || { total: 0 };
    const items = usersData?.data || [];
    return {
      total: meta.total || items.length,
      active: items.filter((u: any) => u.status === 'ACTIVE').length,
      dealers: items.filter((u: any) => u.role === 'DEALER').length,
      suspended: items.filter((u: any) => u.status === 'SUSPENDED').length,
    };
  }, [usersData]);

  const handleSuspend = () => {
    if (!selectedUser || !suspendReason) return;
    const fullReason = suspendNote 
      ? `${suspendReasons.find(r => r.value === suspendReason)?.label}: ${suspendNote}`
      : suspendReasons.find(r => r.value === suspendReason)?.label || suspendReason;
    suspendMutation.mutate({ id: selectedUser.id, reason: fullReason });
  };

  const handleRoleChange = () => {
    if (!selectedUser || !newRole) return;
    updateRoleMutation.mutate({ id: selectedUser.id, role: newRole });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage all users on the platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Dealers', value: stats.dealers, icon: Shield, color: 'text-purple-500' },
          { label: 'Suspended', value: stats.suspended, icon: UserX, color: 'text-red-500' },
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
                <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
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
            placeholder="Search users by name or email..."
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

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Last Login</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Listings</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user: any, index: number) => {
                  const status = statusConfig[user.status as keyof typeof statusConfig] || statusConfig.ACTIVE;
                  const role = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.USER;
                  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                  
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
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
                      <td className="px-4 py-4">
                        {((user.role === 'DEALER' || user.role === 'USER') && subscriptionsMap[user.id]) ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={subscriptionsMap[user.id].plan === 'FREE' ? 'secondary' : 'default'}>
                              {subscriptionsMap[user.id].plan}
                            </Badge>
                            {subscriptionsMap[user.id].status === 'ACTIVE' ? (
                              <Badge variant="outline" className="text-green-600 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 text-xs">
                                {subscriptionsMap[user.id].status}
                              </Badge>
                            )}
                          </div>
                        ) : (user.role === 'DEALER' || user.role === 'USER') ? (
                          <Badge variant="secondary">No Subscription</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {(user as any).lastLoginAt 
                          ? formatDistanceToNow(new Date((user as any).lastLoginAt), { addSuffix: true })
                          : 'Never'
                        }
                      </td>
                      <td className="px-4 py-4 text-sm">{(user as any)._count?.listings || 0}</td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
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
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setRoleDialogOpen(true);
                            }}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            {(user.role === 'DEALER' || user.role === 'USER') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user);
                                  if (user.role === 'DEALER' && user.dealer?.id) {
                                    setSelectedDealerId(user.dealer.id);
                                  } else {
                                    setSelectedDealerId(null);
                                  }
                                  const currentSubscription = subscriptionsMap[user.id];
                                  if (currentSubscription) {
                                    setSelectedPlan(currentSubscription.plan);
                                    setSelectedBillingCycle(currentSubscription.billingCycle || 'monthly');
                                  } else {
                                    setSelectedPlan('PROFESSIONAL');
                                    setSelectedBillingCycle('monthly');
                                  }
                                  setUpgradeDialogOpen(true);
                                }}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Manage Subscription
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {user.status !== 'SUSPENDED' ? (
                              <DropdownMenuItem 
                                className="text-amber-600"
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
                                onClick={() => activateMutation.mutate(user.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
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
        
        {usersData?.meta && usersData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, usersData.meta.total)} of {usersData.meta.total} users
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
                disabled={currentPage >= usersData.meta.totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detailedUser ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="listings">Listings</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={detailedUser.avatar} />
                    <AvatarFallback className="text-xl">
                      {`${detailedUser.firstName?.[0] || ''}${detailedUser.lastName?.[0] || ''}`}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {`${detailedUser.firstName || ''} ${detailedUser.lastName || ''}`.trim() || 'Unknown'}
                    </h3>
                    <p className="text-muted-foreground">{detailedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Role</span>
                      </div>
                      <p className="font-medium mt-1">{detailedUser.role}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Status</span>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium mt-1', 
                        statusConfig[detailedUser.status as keyof typeof statusConfig]?.color
                      )}>
                        {statusConfig[detailedUser.status as keyof typeof statusConfig]?.label || detailedUser.status}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Joined</span>
                      </div>
                      <p className="font-medium mt-1">{new Date(detailedUser.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Listings</span>
                      </div>
                      <p className="font-medium mt-1">{(detailedUser as any)._count?.listings || 0}</p>
                    </CardContent>
                  </Card>
                </div>
                {detailedUser.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{detailedUser.phone}</p>
                  </div>
                )}
                {(detailedUser as any).dealer && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Dealer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{(detailedUser as any).dealer.businessName}</p>
                      <p className="text-sm text-muted-foreground">
                        {(detailedUser as any).dealer.city}, {(detailedUser as any).dealer.province}
                      </p>
                      {(detailedUser as any).dealer.verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="listings" className="mt-4">
                {(detailedUser as any).listings?.length > 0 ? (
                  <div className="space-y-2">
                    {(detailedUser as any).listings.map((listing: any) => (
                      <div key={listing.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          <p className="text-sm text-muted-foreground">
                            ${listing.price?.toLocaleString()} • {listing.status}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/vehicles/${listing.slug}`} target="_blank">View</a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No listings</p>
                )}
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Last Login</p>
                      <p className="text-sm text-muted-foreground">
                        {(detailedUser as any).lastLoginAt 
                          ? new Date((detailedUser as any).lastLoginAt).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Email Verified</p>
                      <p className="text-sm text-muted-foreground">
                        {detailedUser.emailVerified ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Saved Listings</p>
                      <p className="text-sm text-muted-foreground">
                        {(detailedUser as any)._count?.savedListings || 0} items
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <p className="text-sm text-muted-foreground">{selectedUser?.role}</p>
            </div>
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="DEALER">Dealer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRole === 'ADMIN' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                  Admin users have full access to the platform including user management, 
                  content moderation, and system settings.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRoleDialogOpen(false);
              setSelectedUser(null);
              setNewRole('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={updateRoleMutation.isPending || !newRole || newRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Ban className="h-5 w-5" />
              Suspend User
            </DialogTitle>
            <DialogDescription>
              This will prevent the user from accessing their account and all their listings will be hidden.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>
                    {`${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Suspension Reason *</Label>
                <Select value={suspendReason} onValueChange={setSuspendReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {suspendReasons.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Add any additional details..."
                  value={suspendNote}
                  onChange={(e) => setSuspendNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSuspendDialogOpen(false);
              setSelectedUser(null);
              setSuspendReason('');
              setSuspendNote('');
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspendMutation.isPending || !suspendReason}
            >
              {suspendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Suspend User
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
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar>
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>
                    {`${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              {subscriptionsMap[selectedUser.id] && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Current Plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={subscriptionsMap[selectedUser.id].plan === 'FREE' ? 'secondary' : 'default'}>
                      {subscriptionsMap[selectedUser.id].plan}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {subscriptionsMap[selectedUser.id].billingCycle || 'monthly'}
                    </Badge>
                    {subscriptionsMap[selectedUser.id].status === 'ACTIVE' && (
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
              setSelectedUser(null);
              setSelectedDealerId(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpgradeSubscription}
              disabled={upgradeSubscriptionMutation.isPending || !selectedUser}
            >
              {upgradeSubscriptionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All user data, listings, and associated content will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Avatar>
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback>
                  {`${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}
                </p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedUser(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
