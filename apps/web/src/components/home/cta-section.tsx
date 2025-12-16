'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Car, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-carhaus-700 p-8 text-white lg:p-12"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-coral-500/20 blur-2xl" />
            
            <div className="relative">
              <div className="inline-flex rounded-xl bg-white/10 p-3">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="mt-6 font-display text-3xl font-bold">
                Ready to Sell Your Car?
              </h3>
              <p className="mt-4 max-w-sm text-white/80">
                List your vehicle in minutes and reach thousands of potential buyers across Canada.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-coral-400" />
                  Free listing for private sellers
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-coral-400" />
                  Upload up to 20 photos
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-coral-400" />
                  Connect directly with buyers
                </li>
              </ul>
              <Link href="/sell" className="mt-8 inline-block">
                <Button size="lg" variant="glass" className="gap-2">
                  Start Selling
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white lg:p-12"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-coral-500/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />
            
            <div className="relative">
              <div className="inline-flex rounded-xl bg-white/10 p-3">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="mt-6 font-display text-3xl font-bold">
                Are You a Dealer?
              </h3>
              <p className="mt-4 max-w-sm text-white/80">
                Join Canada&apos;s fastest-growing automotive marketplace and boost your sales.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Premium dealer profiles
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Bulk import via XML/JSON
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Analytics & insights
                </li>
              </ul>
              <Link href="/register?type=dealer" className="mt-8 inline-block">
                <Button size="lg" className="gap-2 bg-coral-500 hover:bg-coral-600">
                  Become a Dealer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

