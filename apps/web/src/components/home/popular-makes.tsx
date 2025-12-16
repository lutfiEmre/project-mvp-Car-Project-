'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

const makes = [
  { 
    name: 'Toyota', 
    href: '/search?make=Toyota',
    gradient: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    textColor: 'text-red-600 dark:text-red-400'
  },
  { 
    name: 'Honda', 
    href: '/search?make=Honda',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  { 
    name: 'Ford', 
    href: '/search?make=Ford',
    gradient: 'from-blue-600 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    textColor: 'text-indigo-600 dark:text-indigo-400'
  },
  { 
    name: 'BMW', 
    href: '/search?make=BMW',
    gradient: 'from-blue-700 to-blue-800',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  { 
    name: 'Mercedes-Benz', 
    href: '/search?make=Mercedes-Benz',
    gradient: 'from-slate-600 to-slate-700',
    bgColor: 'bg-slate-50 dark:bg-slate-950/20',
    textColor: 'text-slate-700 dark:text-slate-300'
  },
  { 
    name: 'Audi', 
    href: '/search?make=Audi',
    gradient: 'from-gray-800 to-black',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    textColor: 'text-gray-800 dark:text-gray-200'
  },
  { 
    name: 'Tesla', 
    href: '/search?make=Tesla',
    gradient: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    gif: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2V1b29xdWE4ZHBqb3JvZjJjcGloOHFvbmZkemNteW1xb2szNG5hbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/f1ilU6Cphqogw/giphy.gif'
  },
  { 
    name: 'Chevrolet', 
    href: '/search?make=Chevrolet',
    gradient: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    textColor: 'text-yellow-600 dark:text-yellow-400'
  },
  { 
    name: 'Hyundai', 
    href: '/search?make=Hyundai',
    gradient: 'from-sky-500 to-sky-600',
    bgColor: 'bg-sky-50 dark:bg-sky-950/20',
    textColor: 'text-sky-600 dark:text-sky-400'
  },
  { 
    name: 'Kia', 
    href: '/search?make=Kia',
    gradient: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
    textColor: 'text-cyan-600 dark:text-cyan-400'
  },
  { 
    name: 'Lexus', 
    href: '/search?make=Lexus',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    textColor: 'text-purple-600 dark:text-purple-400'
  },
  { 
    name: 'Porsche', 
    href: '/search?make=Porsche',
    gradient: 'from-red-600 to-red-700',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    textColor: 'text-red-700 dark:text-red-300'
  },
];

export function PopularMakes() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Popular Brands
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Explore vehicles from the world&apos;s most trusted manufacturers
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
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
                  "group relative flex flex-col items-center gap-3 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl overflow-hidden",
                  make.bgColor
                )}>
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    make.gradient
                  )} />
                  
                  <div className={cn(
                    "relative flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110",
                    "bg-white dark:bg-slate-800 shadow-md group-hover:shadow-xl overflow-hidden"
                  )}>
                    {make.gif ? (
                      <img
                        src={make.gif}
                        alt={make.name}
                        className="h-full w-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className={cn(
                        "flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br",
                        make.gradient,
                        "group-hover:scale-105 transition-transform duration-300"
                      )}>
                        <Car className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <span className={cn(
                    "relative text-sm font-semibold transition-colors duration-300",
                    make.textColor,
                    "group-hover:text-white"
                  )}>
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
            href="/makes"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all brands →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

