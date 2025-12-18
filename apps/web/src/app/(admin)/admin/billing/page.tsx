'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Settings, 
  Edit,
  Save,
  X,
  Check,
  Loader2,
  Package,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Zap,
  Image,
  Star,
  FileCode,
  BarChart3,
  Headphones,
  Infinity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn, formatPrice } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const PLAN_NAMES = {
  FREE: 'Free',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const PLAN_ICONS = {
  FREE: Package,
  STARTER: Zap,
  PROFESSIONAL: TrendingUp,
  ENTERPRISE: Infinity,
};

interface PlanDetails {
  price: number;
  maxListings: number;
  maxPhotosPerListing: number;
  featuredListings: number;
  xmlImportEnabled: boolean;
  analyticsEnabled: boolean;
  prioritySupport: boolean;
  description: string;
}

export default function AdminBillingPage() {
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planData, setPlanData] = useState<Record<string, PlanDetails>>({});
  const [selectedDealer, setSelectedDealer] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('PROFESSIONAL');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const queryClient = useQueryClient();

  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => api.admin.getPlans(),
  });

  const { data: dealersData } = useQuery({
    queryKey: ['admin', 'dealers', 'all'],
    queryFn: () => api.admin.getDealers({ page: 1, limit: 1000 }),
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => api.admin.getAllSubscriptions(),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ plan, data }: { plan: string; data: Partial<PlanDetails> }) =>
      api.admin.updatePlan(plan, data),
    onSuccess: () => {
      toast.success('Plan updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'plans'] });
      setEditingPlan(null);
      setPlanData({});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update plan');
    },
  });

  const upgradeDealerMutation = useMutation({
    mutationFn: ({ dealerId, plan, billingCycle }: { dealerId: string; plan: string; billingCycle: 'monthly' | 'yearly' }) =>
      api.admin.upgradeDealerSubscription(dealerId, plan, billingCycle),
    onSuccess: () => {
      toast.success('Subscription upgraded successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dealers'] });
      setSelectedDealer(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upgrade subscription');
    },
  });

  const plans = useMemo(() => {
    if (!plansData) return {};
    return plansData;
  }, [plansData]);

  const dealers = useMemo(() => {
    return dealersData?.data || [];
  }, [dealersData]);

  const subscriptions = useMemo(() => {
    return subscriptionsData || [];
  }, [subscriptionsData]);

  const dealersWithPayments = useMemo(() => {
    return dealers.map((dealer: any) => {
      const subscription = subscriptions.find((sub: any) => sub.dealerId === dealer.id);
      const hasActivePayment = subscription?.status === 'ACTIVE';
      return {
        ...dealer,
        subscription,
        hasActivePayment,
      };
    });
  }, [dealers, subscriptions]);

  const handleEditPlan = (plan: string) => {
    setEditingPlan(plan);
    const currentPlan = plans[plan] as PlanDetails | undefined;
    setPlanData({
      [plan]: currentPlan || {
        price: 0,
        maxListings: 0,
        maxPhotosPerListing: 0,
        featuredListings: 0,
        xmlImportEnabled: false,
        analyticsEnabled: false,
        prioritySupport: false,
        description: '',
      },
    });
  };

  const handleSavePlan = (plan: string) => {
    if (!planData[plan]) return;
    const dataToSave = {
      price: planData[plan].price,
      maxListings: planData[plan].maxListings,
      maxPhotosPerListing: planData[plan].maxPhotosPerListing,
      featuredListings: planData[plan].featuredListings,
      xmlImportEnabled: planData[plan].xmlImportEnabled,
      analyticsEnabled: planData[plan].analyticsEnabled,
      prioritySupport: planData[plan].prioritySupport,
      description: planData[plan].description,
    };
    updatePlanMutation.mutate({ plan, data: dataToSave });
  };

  const handleUpgradeDealer = () => {
    if (!selectedDealer) return;
    upgradeDealerMutation.mutate({ 
      dealerId: selectedDealer.id, 
      plan: selectedPlan, 
      billingCycle: selectedBillingCycle 
    });
  };

  const stats = useMemo(() => {
    const totalDealers = dealers.length;
    const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'ACTIVE').length;
    const paidSubscriptions = subscriptions.filter((sub: any) => 
      sub.status === 'ACTIVE' && sub.plan !== 'FREE'
    ).length;
    const totalRevenue = subscriptions
      .filter((sub: any) => sub.status === 'ACTIVE' && sub.plan !== 'FREE')
      .reduce((sum: number, sub: any) => sum + Number(sub.price || 0), 0);

    return {
      totalDealers,
      activeSubscriptions,
      paidSubscriptions,
      totalRevenue,
    };
  }, [dealers, subscriptions]);

  if (isLoadingPlans) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Billing & Plans Management</h1>
        <p className="text-muted-foreground">
          Manage subscription plans, pricing, and dealer subscriptions
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Dealers', value: stats.totalDealers, icon: Users, color: 'text-blue-500' },
          { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: Check, color: 'text-green-500' },
          { label: 'Paid Subscriptions', value: stats.paidSubscriptions, icon: CreditCard, color: 'text-purple-500' },
          { label: 'Monthly Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-500' },
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
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(PLAN_NAMES).map(([planKey, planName]) => {
          const plan = plans[planKey] as PlanDetails | undefined;
          const isEditing = editingPlan === planKey;
          const Icon = PLAN_ICONS[planKey as keyof typeof PLAN_ICONS];
          const PlanIcon = Icon;

          return (
            <motion.div
              key={planKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <PlanIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{planName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan?.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPlan(planKey)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Price (CAD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={planData[planKey]?.price || 0}
                          onChange={(e) => setPlanData({
                            ...planData,
                            [planKey]: { ...planData[planKey]!, price: parseFloat(e.target.value) || 0 },
                          })}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={planData[planKey]?.description || ''}
                          onChange={(e) => setPlanData({
                            ...planData,
                            [planKey]: { ...planData[planKey]!, description: e.target.value },
                          })}
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Max Listings</Label>
                          <Input
                            type="number"
                            value={planData[planKey]?.maxListings === -1 ? 'Unlimited' : planData[planKey]?.maxListings || 0}
                            onChange={(e) => {
                              const value = e.target.value === 'Unlimited' || e.target.value === '' ? -1 : parseInt(e.target.value) || 0;
                              setPlanData({
                                ...planData,
                                [planKey]: { ...planData[planKey]!, maxListings: value },
                              });
                            }}
                            placeholder="-1 for unlimited"
                          />
                        </div>
                        <div>
                          <Label>Max Photos/Listing</Label>
                          <Input
                            type="number"
                            value={planData[planKey]?.maxPhotosPerListing || 0}
                            onChange={(e) => setPlanData({
                              ...planData,
                              [planKey]: { ...planData[planKey]!, maxPhotosPerListing: parseInt(e.target.value) || 0 },
                            })}
                          />
                        </div>
                        <div>
                          <Label>Featured Listings</Label>
                          <Input
                            type="number"
                            value={planData[planKey]?.featuredListings || 0}
                            onChange={(e) => setPlanData({
                              ...planData,
                              [planKey]: { ...planData[planKey]!, featuredListings: parseInt(e.target.value) || 0 },
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                            <Label>XML Import</Label>
                          </div>
                          <Switch
                            checked={planData[planKey]?.xmlImportEnabled || false}
                            onCheckedChange={(checked) => setPlanData({
                              ...planData,
                              [planKey]: { ...planData[planKey]!, xmlImportEnabled: checked },
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <Label>Analytics</Label>
                          </div>
                          <Switch
                            checked={planData[planKey]?.analyticsEnabled || false}
                            onCheckedChange={(checked) => setPlanData({
                              ...planData,
                              [planKey]: { ...planData[planKey]!, analyticsEnabled: checked },
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Headphones className="h-4 w-4 text-muted-foreground" />
                            <Label>Priority Support</Label>
                          </div>
                          <Switch
                            checked={planData[planKey]?.prioritySupport || false}
                            onCheckedChange={(checked) => setPlanData({
                              ...planData,
                              [planKey]: { ...planData[planKey]!, prioritySupport: checked },
                            })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSavePlan(planKey)}
                          disabled={updatePlanMutation.isPending}
                          className="flex-1"
                        >
                          {updatePlanMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingPlan(null);
                            setPlanData({});
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{formatPrice(plan?.price || 0)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Max Listings: {plan?.maxListings === -1 ? 'Unlimited' : plan?.maxListings || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Image className="h-4 w-4 text-muted-foreground" />
                          <span>Max Photos: {plan?.maxPhotosPerListing || 0} per listing</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span>Featured Listings: {plan?.featuredListings || 0}</span>
                        </div>
                        {plan?.xmlImportEnabled && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileCode className="h-4 w-4" />
                            <span>XML Import Enabled</span>
                          </div>
                        )}
                        {plan?.analyticsEnabled && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <BarChart3 className="h-4 w-4" />
                            <span>Analytics Enabled</span>
                          </div>
                        )}
                        {plan?.prioritySupport && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Headphones className="h-4 w-4" />
                            <span>Priority Support</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dealer Subscriptions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage dealer subscriptions and upgrade plans
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dealersWithPayments.map((dealer: any) => (
              <div
                key={dealer.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">{dealer.businessName}</p>
                    <p className="text-sm text-muted-foreground">{dealer.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={dealer.subscription?.plan === 'FREE' ? 'secondary' : 'default'}>
                      {dealer.subscription?.plan || 'FREE'}
                    </Badge>
                    {dealer.hasActivePayment ? (
                      <Badge variant="outline" className="text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No Payment
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDealer(dealer);
                    setSelectedPlan(dealer.subscription?.plan || 'FREE');
                    setSelectedBillingCycle(dealer.subscription?.billingCycle || 'monthly');
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDealer} onOpenChange={(open) => !open && setSelectedDealer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade Subscription</DialogTitle>
            <DialogDescription>
              Upgrade dealer subscription without payment
            </DialogDescription>
          </DialogHeader>
          {selectedDealer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">{selectedDealer.businessName}</p>
                  <p className="text-sm text-muted-foreground">{selectedDealer.user?.email}</p>
                </div>
              </div>
              <div>
                <Label>Select Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLAN_NAMES).map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleUpgradeDealer}
                  disabled={upgradeDealerMutation.isPending}
                >
                  {upgradeDealerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Upgrade
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDealer(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

