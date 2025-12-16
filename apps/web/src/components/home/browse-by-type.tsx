'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const categories = [
  {
    name: 'SUV',
    count: '12,450+',
    href: '/search?bodyType=SUV',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    name: 'Sedan',
    count: '8,320+',
    href: '/search?bodyType=SEDAN',
    gradient: 'from-violet-500 to-purple-400',
  },
  {
    name: 'Pickup Truck',
    count: '6,890+',
    href: '/search?bodyType=PICKUP',
    gradient: 'from-orange-500 to-amber-400',
  },
  {
    name: 'Electric',
    count: '3,240+',
    href: '/search?fuelType=ELECTRIC',
    gradient: 'from-emerald-500 to-green-400',
  },
  {
    name: 'Luxury',
    count: '4,560+',
    href: '/search?bodyType=LUXURY',
    gradient: 'from-rose-500 to-pink-400',
  },
  {
    name: 'Sports Car',
    count: '2,180+',
    href: '/search?bodyType=SPORTS_CAR',
    gradient: 'from-red-500 to-orange-400',
  },
];

export function BrowseByType() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Browse by Category
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Find the perfect vehicle type that fits your lifestyle
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link href={category.href}>
                <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:bg-slate-800">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} listings
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

