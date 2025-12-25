'use client';

import { motion } from 'framer-motion';
import { Car, Users, Shield, Award, Heart, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('about');
  const tc = useTranslations('common');
  
  const stats = [
    { value: '50K+', label: t('activeListings') },
    { value: '2.5K+', label: t('trustedDealers') },
    { value: '100K+', label: t('happyCustomers') },
    { value: '10+', label: t('yearsExperience') },
  ];

  const values = [
    {
      icon: Shield,
      title: t('value1Title'),
      description: t('value1Desc'),
    },
    {
      icon: Users,
      title: t('value2Title'),
      description: t('value2Desc'),
    },
    {
      icon: Award,
      title: t('value3Title'),
      description: t('value3Desc'),
    },
    {
      icon: Heart,
      title: t('value4Title'),
      description: t('value4Desc'),
    },
  ];

  const team = [
    { name: 'Sarah Chen', role: 'CEO & Founder', image: '👩‍💼' },
    { name: 'Michael Roberts', role: 'CTO', image: '👨‍💻' },
    { name: 'Emily Davis', role: 'Head of Operations', image: '👩‍🔧' },
    { name: 'EmreLutfi', role: 'Senior Full Stack Developer', image: '👨‍💼' },
  ];
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bgnew.png)' }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <Car className="h-4 w-4" />
              <span>{t('ourStory')}</span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
              <span className="block bg-gradient-to-r from-coral-400 to-coral-300 bg-clip-text text-transparent">
                {t('heroHighlight')}
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/80">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="font-display text-4xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-1 text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('missionTitle')}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t('missionText1')}
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t('missionText2')}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Globe className="h-12 w-12 text-primary" />
              <div>
                <p className="font-semibold">{t('servingCanada')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('coastToCoast')}
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-3xl bg-gradient-to-br from-primary/20 to-coral-500/20 p-1">
              <div className="flex h-full items-center justify-center rounded-[22px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src="https://img.freepik.com/free-photo/about-as-service-contact-information-concept_53876-138509.jpg?semt=ais_hybrid&w=740&q=80"
                  alt="About CarHaus"
                  className="h-full w-full object-cover rounded-[22px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('valuesTitle')}</h2>
            <p className="mt-3 text-muted-foreground">
              {t('valuesSubtitle')}
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border bg-card p-6 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('teamTitle')}</h2>
          <p className="mt-3 text-muted-foreground">
            {t('teamSubtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-coral-500/20 text-5xl">
                {member.image}
              </div>
              <h3 className="mt-4 font-display font-semibold">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {t('ctaTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            {t('ctaSubtitle')}
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/search">
              <Button size="xl" variant="secondary" className="w-full rounded-xl sm:w-auto">
                {t('browseVehicles')}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="xl" variant="outline" className="w-full !text-black rounded-xl border-white/30 text-white hover:bg-white/10 sm:w-auto">
                {t('createAccount')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Test Accounts */}
      <section className="container mx-auto px-4 pb-20">
       
      </section>
    </div>
  );
}

