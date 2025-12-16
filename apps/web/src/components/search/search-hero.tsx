'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const popularMakes = [
  'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi',
  'Chevrolet', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'Subaru',
];

const priceRanges = [
  { label: 'Under $15,000', value: '0-15000' },
  { label: '$15,000 - $25,000', value: '15000-25000' },
  { label: '$25,000 - $40,000', value: '25000-40000' },
  { label: '$40,000 - $60,000', value: '40000-60000' },
  { label: '$60,000 - $100,000', value: '60000-100000' },
  { label: 'Over $100,000', value: '100000-999999' },
];

const bodyTypes = [
  { label: 'SUV', value: 'SUV' },
  { label: 'Sedan', value: 'SEDAN' },
  { label: 'Truck', value: 'PICKUP' },
  { label: 'Coupe', value: 'COUPE' },
  { label: 'Hatchback', value: 'HATCHBACK' },
  { label: 'Convertible', value: 'CONVERTIBLE' },
];

export function SearchHero() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [make, setMake] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const setStartTime = () => {
        if (video.readyState >= 2) {
          video.currentTime = 40;
        }
      };

      const handleLoadedData = () => {
        video.currentTime = 40;
      };

      const handleCanPlay = () => {
        if (video.currentTime < 40) {
          video.currentTime = 40;
        }
      };

      const handleTimeUpdate = () => {
        // Video başlangıçta 0'dan başlarsa 40'a atla
        if (video.currentTime < 40 && video.currentTime > 0 && video.currentTime < 1) {
          video.currentTime = 40;
        }
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('timeupdate', handleTimeUpdate);
      
      // Eğer video zaten yüklenmişse
      if (video.readyState >= 2) {
        setStartTime();
      }

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (make) params.set('make', make);
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      params.set('priceMin', min);
      params.set('priceMax', max);
    }
    if (bodyType) params.set('bodyType', bodyType);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        onLoadedData={(e) => {
          e.currentTarget.currentTime = 40;
        }}
        onCanPlay={(e) => {
          if (e.currentTarget.currentTime < 40) {
            e.currentTarget.currentTime = 40;
          }
        }}
        onEnded={(e) => {
          // Video bittiğinde başa dön
          e.currentTarget.currentTime = 40;
          e.currentTarget.play();
        }}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src="/carvideo.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <VolumeX className="h-6 w-6 text-white" />
        ) : (
          <Volume2 className="h-6 w-6 text-white" />
        )}
      </button>
      
      <div className="absolute top-20 left-10 z-10 h-72 w-72 rounded-full bg-coral-500/20 blur-3xl" />
      <div className="absolute bottom-20 right-10 z-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      <div className="container relative z-20 mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-coral-400" />
              <span>Over 50,000 vehicles available across Canada</span>
            </div>
            
            <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find Your
              <span className="block bg-gradient-to-r from-coral-400 to-coral-300 bg-clip-text text-transparent">
                Perfect Drive
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              Discover thousands of quality vehicles from trusted dealers and private sellers.
              Your next car is just a search away.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10"
          >
            <div className="mx-auto max-w-3xl rounded-2xl bg-white/55 p-3 shadow-2xl backdrop-blur-sm dark:bg-slate-900/95">
              <div className="grid gap-3 sm:grid-cols-4">
                <Select value={make} onValueChange={setMake}>
                  <SelectTrigger className="h-14 border-0 bg-slate-50 text-base dark:bg-slate-800">
                    <SelectValue placeholder="Any Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularMakes.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-14 border-0 bg-slate-50 text-base dark:bg-slate-800">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={bodyType} onValueChange={setBodyType}>
                  <SelectTrigger className="h-14 border-0 bg-slate-50 text-base dark:bg-slate-800">
                    <SelectValue placeholder="Body Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyTypes.map((b) => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="xl"
                  className="h-14 gap-2 text-base"
                  onClick={handleSearch}
                >
                  <Search className="h-5 w-5" />
                  Search
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
              <span>Popular:</span>
              {['Tesla', 'Toyota RAV4', 'Honda Civic', 'Ford F-150'].map((term) => (
                <button
                  key={term}
                  onClick={() => router.push(`/search?q=${term}`)}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { value: '50K+', label: 'Active Listings' },
            { value: '2,500+', label: 'Trusted Dealers' },
            { value: '98%', label: 'Happy Customers' },
            { value: '24/7', label: 'Support' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ 
                duration: 0.6, 
                delay: 0.5 + i * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="group rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:scale-105"
            >
              <p className="font-display text-3xl font-bold text-white">
                <AnimatedCounter value={stat.value} duration={2} />
              </p>
              <p className="mt-1 text-sm text-white/70 transition-colors group-hover:text-white/90">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

