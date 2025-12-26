'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Users, Award, Clock, HeartHandshake } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function WhyCarhaus() {
  const t = useTranslations('home');
  
  const features = [
    {
      icon: Shield,
      title: t('verifiedDealers'),
      description: t('verifiedDealersDesc'),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Zap,
      title: t('instantSearch'),
      description: t('instantSearchDesc'),
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Users,
      title: t('directContact'),
      description: t('directContactDesc'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Award,
      title: t('qualityListings'),
      description: t('qualityListingsDesc'),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Clock,
      title: t('realTimeUpdates'),
      description: t('realTimeUpdatesDesc'),
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      icon: HeartHandshake,
      title: t('trustedPlatform'),
      description: t('trustedPlatformDesc'),
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {t('whyChooseDrivingAway')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('whyChooseSubtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-slate-800"
            >
              <div className={`inline-flex rounded-xl ${feature.bg} p-3`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

