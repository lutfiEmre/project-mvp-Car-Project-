'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  CreditCard, 
  Download, 
  Check,
  Zap,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const getPlanFeatures = (plan: any) => {
  const features: string[] = [];
  if (plan.maxListings === -1) {
    features.push('Unlimited listings');
  } else {
    features.push(`${plan.maxListings} active listings`);
  }
  features.push(`${plan.maxPhotosPerListing} photos per listing`);
  if (plan.analyticsEnabled) {
    features.push('Advanced analytics');
  }
  if (plan.xmlImportEnabled) {
    features.push('XML import');
  }
  if (plan.prioritySupport) {
    features.push('Priority support');
  } else {
    features.push('Email support');
  }
  return features;
};

export default function DealerBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: currentSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: () => api.subscriptions.getCurrent(),
    retry: false,
  });

  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: () => api.subscriptions.getPlans(),
  });

  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: () => api.payments.getHistory({ limit: 10 }),
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ plan, billingCycle }: { plan: string; billingCycle: 'monthly' | 'yearly' }) =>
      api.payments.createCheckoutSession(plan, billingCycle),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create checkout session');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.payments.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success && sessionId) {
      toast.success('Payment successful! Your subscription is now active.');
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      router.replace('/dealer/billing');
    } else if (canceled) {
      toast.info('Payment was cancelled');
      router.replace('/dealer/billing');
    }
  }, [searchParams, queryClient, router]);

  const handleSubscribe = (plan: string) => {
    if (plan === 'FREE') {
      toast.info('You are already on the free plan');
      return;
    }
    setSelectedPlan(plan);
    checkoutMutation.mutate({ plan, billingCycle });
  };

  const currentPlan = currentSubscription?.plan || 'FREE';
  
  const plansMap = useMemo(() => {
    if (!plansData || !Array.isArray(plansData)) return {};
    const map: Record<string, any> = {};
    plansData.forEach((plan: any) => {
      if (plan && plan.plan) {
        map[plan.plan] = {
          ...plan,
          name: PLAN_NAMES[plan.plan] || plan.plan,
          yearlyPrice: (plan.price || 0) * 10,
          features: getPlanFeatures(plan),
        };
      }
    });
    return map;
  }, [plansData]);

  const planDetails = plansMap[currentPlan] || {
    name: PLAN_NAMES[currentPlan] || currentPlan,
    price: 0,
    yearlyPrice: 0,
    features: ['3 active listings', '5 photos per listing', 'Basic support'],
    description: 'Perfect for getting started',
  };
  const currentPrice = billingCycle === 'yearly' 
    ? (planDetails.yearlyPrice || planDetails.price * 10) 
    : (planDetails.price || 0);

  const plans = Object.entries(plansMap).filter(([key]) => key !== 'FREE');

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {isLoadingSubscription || isLoadingPlans ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {currentSubscription && currentSubscription.status === 'ACTIVE' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border bg-gradient-to-r from-primary/10 to-coral-500/10 p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{planDetails.name} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentSubscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} billing
                      {currentSubscription.endDate && (
                        <> • Renews {new Date(currentSubscription.endDate).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-muted-foreground">
                    /{currentSubscription.billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
              </div>
              {currentSubscription.maxListings > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Listings usage</span>
                    <span className="font-medium">
                      {currentSubscription.maxListings === -1 ? 'Unlimited' : `Limited to ${currentSubscription.maxListings}`}
                    </span>
                  </div>
                </div>
              )}
              {currentSubscription.status === 'ACTIVE' && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel your subscription?')) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {(!currentSubscription || currentSubscription.status !== 'ACTIVE') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    No Active Subscription
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    You are currently on the free plan. Upgrade to unlock more features.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mb-6 flex items-center justify-center gap-2">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded">Save 2 months</span>
            </Button>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4">Available Plans</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map(([planKey, plan], index) => {
                const isCurrent = currentPlan === planKey && currentSubscription?.status === 'ACTIVE';
                const price = billingCycle === 'yearly' ? (plan.yearlyPrice || plan.price * 10) : plan.price;
                const isPopular = planKey === 'PROFESSIONAL';

                return (
                  <motion.div
                    key={planKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'relative rounded-xl border p-6',
                      isCurrent && 'border-primary ring-2 ring-primary/20',
                      isPopular && !isCurrent && 'border-coral-500'
                    )}
                  >
                    {isPopular && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-coral-500 px-3 py-1 text-xs font-medium text-white">
                          Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="font-display font-semibold">{plan.name}</h3>
                      <div className="mt-3">
                        <span className="text-4xl font-bold">{formatPrice(price)}</span>
                        <span className="text-muted-foreground">
                          /{billingCycle === 'yearly' ? 'year' : 'mo'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="mt-6 w-full"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent || checkoutMutation.isPending}
                      onClick={() => handleSubscribe(planKey)}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Current Plan
                        </>
                      ) : checkoutMutation.isPending && selectedPlan === planKey ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Subscribe'
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border bg-card"
          >
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : paymentsData?.data && paymentsData.data.length > 0 ? (
                <div className="divide-y">
                  {paymentsData.data.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{payment.invoiceNumber || payment.id}</p>
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {new Date(payment.createdAt).toLocaleDateString()}
                            {payment.description && ` • ${payment.description}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(Number(payment.amount))}</p>
                          <p className={cn(
                            "text-xs capitalize",
                            payment.status === 'COMPLETED' ? 'text-green-600' :
                            payment.status === 'FAILED' ? 'text-red-600' :
                            'text-amber-600'
                          )}>
                            {payment.status.toLowerCase()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            window.open(`/dealer/billing/invoice/${payment.id}`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No payment history</p>
                </div>
              )}
            </CardContent>
          </motion.div>
        </>
      )}
    </div>
  );
}
