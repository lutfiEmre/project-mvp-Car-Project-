'use client';

import Link from 'next/link';
import { Car } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('authLayout');
  
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex relative lg:w-1/2 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-carhaus-950/80 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <Car className="h-6 w-6" />
              </div>
              <span className="font-display text-xl font-bold">CarHaus</span>
            </Link>
          </motion.div>

          {/* Animated SVG Computer */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0
              }}
              transition={{ 
                duration: 0.8,
                delay: 0.3,
                type: "spring",
                stiffness: 100
              }}
              className="relative"
            >
              {/* Glow effect behind SVG */}
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
              
              {/* Floating animation */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                <Image 
                  src="/Vehicle Sale-bro.svg" 
                  alt="CarHaus Platform" 
                  width={400} 
                  height={400}
                  className="drop-shadow-2xl w-[300px] h-[300px]"
                  priority
                />
              </motion.div>

              {/* Decorative circles */}
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-primary/10 blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </motion.div>
          </div>

          {/* Bottom content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-md"
          >
            <h1 className="font-display text-4xl font-bold leading-tight">
              {t('findPerfectVehicle')}
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {t('joinThousands')}
            </p>
            
            <div className="mt-8 flex gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <p className="text-3xl font-bold">50K+</p>
                <p className="text-sm text-white/70">{t('activeListings')}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <p className="text-3xl font-bold">2.5K+</p>
                <p className="text-sm text-white/70">{t('trustedDealers')}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <p className="text-3xl font-bold">98%</p>
                <p className="text-sm text-white/70">{t('satisfaction')}</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">CarHaus</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

