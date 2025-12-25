'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Users, Award, Clock, HeartHandshake } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Verified Dealers',
    description: 'Every dealer on our platform is thoroughly vetted and verified for your peace of mind.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Instant Search',
    description: 'Find your perfect car in seconds with our powerful search and filter system.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Direct Contact',
    description: 'Connect directly with sellers and dealers without any middlemen.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Award,
    title: 'Quality Listings',
    description: 'Every listing is reviewed to ensure accurate information and quality photos.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Clock,
    title: 'Real-Time Updates',
    description: 'Get notified instantly when new vehicles matching your criteria are listed.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: HeartHandshake,
    title: 'Trusted Platform',
    description: 'Join thousands of satisfied buyers and sellers across Canada.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

export function WhyCarhaus() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Why Choose DrivingAway?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We&apos;re building the most trusted automotive marketplace in Canada
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

