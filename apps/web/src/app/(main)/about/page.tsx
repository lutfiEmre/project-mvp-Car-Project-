'use client';

import { motion } from 'framer-motion';
import { Car, Users, Shield, Award, Heart, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const stats = [
  { value: '50K+', label: 'Active Listings' },
  { value: '2.5K+', label: 'Trusted Dealers' },
  { value: '100K+', label: 'Happy Customers' },
  { value: '10+', label: 'Years Experience' },
];

const values = [
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We believe in honest dealings. Every listing is verified, and we provide complete vehicle history.',
  },
  {
    icon: Users,
    title: 'Customer First',
    description: 'Our customers are at the heart of everything we do. We are committed to exceptional service.',
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'We partner only with reputable dealers who meet our strict quality standards.',
  },
  {
    icon: Heart,
    title: 'Community',
    description: 'We are building a community of car enthusiasts who share our passion for great vehicles.',
  },
];

const team = [
  { name: 'Sarah Chen', role: 'CEO & Founder', image: '👩‍💼' },
  { name: 'Michael Roberts', role: 'CTO', image: '👨‍💻' },
  { name: 'Emily Davis', role: 'Head of Operations', image: '👩‍🔧' },
  { name: 'EmreLutfi', role: 'Senior Full Stack Developer', image: '👨‍💼' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary to-slate-900 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-coral-500/20 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <Car className="h-4 w-4" />
              <span>Our Story</span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Driving the Future of
              <span className="block bg-gradient-to-r from-coral-400 to-coral-300 bg-clip-text text-transparent">
                Car Shopping
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/80">
              CarHaus was founded with a simple mission: to make buying and selling vehicles 
              a seamless, transparent, and enjoyable experience for everyone.
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
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Our Mission</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              At CarHaus, we are on a mission to transform the automotive marketplace in Canada. 
              We believe that buying or selling a vehicle should be simple, secure, and stress-free.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our platform connects buyers with trusted dealers and private sellers, 
              providing all the tools and information needed to make confident decisions. 
              From detailed vehicle histories to secure payment options, we have got you covered.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Globe className="h-12 w-12 text-primary" />
              <div>
                <p className="font-semibold">Serving All of Canada</p>
                <p className="text-sm text-muted-foreground">
                  From coast to coast, we are here for you
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
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Our Values</h2>
            <p className="mt-3 text-muted-foreground">
              The principles that guide everything we do
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
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Meet Our Team</h2>
          <p className="mt-3 text-muted-foreground">
            The passionate people behind CarHaus
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
            Ready to Get Started?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Join thousands of Canadians who trust CarHaus for their vehicle needs.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/search">
              <Button size="xl" variant="secondary" className="w-full rounded-xl sm:w-auto">
                Browse Vehicles
              </Button>
            </Link>
            <Link href="/register">
              <Button size="xl" variant="outline" className="w-full !text-black rounded-xl border-white/30 text-white hover:bg-white/10 sm:w-auto">
                Create Account
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

