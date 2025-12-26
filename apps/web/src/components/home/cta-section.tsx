'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Car, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function CTASection() {
  const t = useTranslations('home');
  
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
                {t('readyToSell')}
              </h3>
              <p className="mt-4 max-w-sm text-white/80">
                {t('readyToSellDesc')}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-coral-400" />
                  {t('freeListing')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-coral-400" />
                  {t('uploadPhotos')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-coral-400" />
                  {t('connectBuyers')}
                </li>
              </ul>
              <Link href="/sell" className="mt-8 inline-block">
                <Button size="lg" variant="glass" className="gap-2">
                  {t('startSelling')}
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
                {t('areYouDealer')}
              </h3>
              <p className="mt-4 max-w-sm text-white/80">
                {t('dealerDesc')}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t('premiumProfiles')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t('bulkImport')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t('analyticsInsights')}
                </li>
              </ul>
              <Link href="/register?type=dealer" className="mt-8 inline-block">
                <Button size="lg" className="gap-2 bg-coral-500 hover:bg-coral-600">
                  {t('becomeDealer')}
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

