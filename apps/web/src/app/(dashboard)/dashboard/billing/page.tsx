'use client';

import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  Plus, 
  Check,
  Crown,
  Zap,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for individuals',
    features: ['5 active listings', '10 photos per listing', 'Basic support'],
    current: false,
  },
  {
    name: 'Starter',
    price: 29,
    description: 'For growing sellers',
    features: ['25 active listings', '20 photos per listing', 'Priority support', 'Analytics'],
    current: true,
    popular: true,
  },
  {
    name: 'Professional',
    price: 79,
    description: 'For dealers',
    features: ['100 active listings', '50 photos per listing', 'XML import', 'Featured listings', 'Dedicated support'],
    current: false,
  },
];

const invoices = [
  { id: 'INV-001', date: '2024-01-01', amount: 29, status: 'paid' },
  { id: 'INV-002', date: '2023-12-01', amount: 29, status: 'paid' },
  { id: 'INV-003', date: '2023-11-01', amount: 29, status: 'paid' },
];

export default function BillingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <div className="mb-8 rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Starter Plan</h3>
              <p className="text-sm text-muted-foreground">
                Renews on February 1, 2024
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">$29</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="mb-8">
        <h2 className="font-display text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative rounded-xl border p-6',
                plan.current && 'border-primary ring-2 ring-primary/20',
                plan.popular && !plan.current && 'border-primary'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                    Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="font-display font-semibold">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
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
                variant={plan.current ? 'outline' : 'default'}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-8 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Payment Method</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
        
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex h-10 w-14 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-blue-800">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium">•••• •••• •••• 4242</p>
            <p className="text-sm text-muted-foreground">Expires 12/25</p>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 border-b">
          <h2 className="font-display text-lg font-semibold">Billing History</h2>
        </div>
        <div className="divide-y">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {invoice.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">${invoice.amount}</p>
                  <p className="text-xs text-green-600 capitalize">{invoice.status}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

