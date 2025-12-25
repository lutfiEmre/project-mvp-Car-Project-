'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const makes = [
  { 
    name: 'Toyota', 
    href: '/search?make=Toyota',
    logo: '/brands/toyota-car-logo-6958.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Honda', 
    href: '/search?make=Honda',
    logo: '/brands/honda-png-logo-32835.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Ford', 
    href: '/search?make=Ford',
    logo: '/brands/ford-logo-png-1772.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'BMW', 
    href: '/search?make=BMW',
    logo: '/brands/bmw-logo-697.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Mercedes-Benz', 
    href: '/search?make=Mercedes-Benz',
    logo: '/brands/car-logo-png-2296.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Audi', 
    href: '/search?make=Audi',
    logo: '/brands/audi-logo-png-746.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Tesla', 
    href: '/search?make=Tesla',
    logo: '/brands/tesla-logo-png-2251.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Chevrolet', 
    href: '/search?make=Chevrolet',
    logo: '/brands/chevrolette.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Hyundai', 
    href: '/search?make=Hyundai',
    logo: '/brands/hyundai-logo-355.gif',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Kia', 
    href: '/search?make=Kia',
    logo: '/brands/kia-logo-svg-vector.svg',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Lexus', 
    href: '/search?make=Lexus',
    logo: '/brands/lexus.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
  { 
    name: 'Porsche', 
    href: '/search?make=Porsche',
    logo: '/brands/porsche.png',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
];

export function PopularMakes() {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const t = useTranslations('home');

  const handleImageError = (makeName: string) => {
    setFailedImages(prev => new Set(prev).add(makeName));
  };

  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {t('popularMakes')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('popularMakesSubtitle')}
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
          {makes.map((make, index) => (
            <motion.div
              key={make.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={make.href}>
                <div className={cn(
                  "group relative flex flex-col items-center gap-3 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100 dark:border-gray-800",
                  make.bgColor
                )}>
                  <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center">
                    {failedImages.has(make.name) ? (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary text-white text-2xl font-bold">
                        {make.name[0]}
                      </div>
                    ) : (
                      <img
                        src={make.logo}
                        alt={`${make.name} logo`}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                        onError={() => handleImageError(make.name)}
                      />
                    )}
                  </div>
                  
                  <span className="text-sm font-semibold text-center text-foreground">
                    {make.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/search"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('viewAllBrands')} →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
