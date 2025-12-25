'use client';

import { motion } from 'framer-motion';
import { Car, Camera, DollarSign, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function SellPage() {
  const t = useTranslations('sell');
  const tc = useTranslations('common');
  
  const steps = [
    {
      icon: Car,
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      icon: Camera,
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      icon: DollarSign,
      title: t('step3Title'),
      description: t('step3Desc'),
    },
    {
      icon: Users,
      title: t('step4Title'),
      description: t('step4Desc'),
    },
  ];

  const benefits = [
    t('benefit1'),
    t('benefit2'),
    t('benefit3'),
    t('benefit4'),
    t('benefit5'),
    t('benefit6'),
  ];
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bgnew.png)' }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                🚗 {t('soldMonthly')}
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                {t('title')}
                <span className="block bg-gradient-to-r from-coral-400 to-coral-300 bg-clip-text text-transparent">
                  {t('titleHighlight')}
                </span>
              </h1>
              <p className="mt-6 text-lg text-white/80">
                {t('subtitle')}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/dashboard/listings/new">
                  <Button size="xl" variant="secondary" className="w-full rounded-xl sm:w-auto">
                    {t('getStarted')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="xl" variant="outline" className="w-full rounded-xl border-white/30 text-black hover:bg-white/10 sm:w-auto">
                  {t('getPriceEstimate')}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('howItWorks')}</h2>
          <p className="mt-3 text-muted-foreground">
            {t('howItWorksSubtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -right-4 top-8 hidden text-4xl font-bold text-slate-100 dark:text-slate-800 lg:block">
                {index + 1}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {t('whySellTitle')}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t('whySellSubtitle')}
              </p>
              
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <Link href="/register" className="mt-8 inline-block">
                <Button size="lg" className="rounded-xl">
                  {t('createAccount')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-coral-500/20 p-8">
                <div className="flex h-full items-center justify-center rounded-2xl overflow-hidden">
                  <img
                    src="https://carhaus.es/wp-content/uploads/2023/01/fachada_carhaus_molins_c-1024x768.jpg"
                    alt="CarHaus"
                    className="h-full w-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-coral-500 to-coral-600 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {t('ctaTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            {t('ctaSubtitle')}
          </p>
          <Link href="/dashboard/listings/new">
            <Button size="xl" variant="secondary" className="mt-6 rounded-xl">
              {t('ctaButton')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

