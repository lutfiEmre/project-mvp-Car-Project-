'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Sparkles, Volume2, VolumeX, Car, Truck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

const popularMakes = [
  'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi',
  'Chevrolet', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'Subaru',
];

// Models by make
const modelsByMake: Record<string, string[]> = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', '4Runner', 'Sienna'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport'],
  'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Bronco', 'Edge', 'Ranger', 'Expedition'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'X7', '7 Series', 'M3', 'M5', 'i4'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'AMG GT'],
  'Audi': ['A4', 'A6', 'Q5', 'Q7', 'Q3', 'e-tron', 'A3', 'RS6', 'TT'],
  'Chevrolet': ['Silverado', 'Equinox', 'Tahoe', 'Camaro', 'Corvette', 'Traverse', 'Colorado', 'Blazer'],
  'Hyundai': ['Tucson', 'Santa Fe', 'Elantra', 'Sonata', 'Palisade', 'Kona', 'Ioniq 5', 'Venue'],
  'Kia': ['Sportage', 'Sorento', 'Telluride', 'Forte', 'K5', 'Soul', 'EV6', 'Seltos'],
  'Nissan': ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Murano', 'Frontier', 'Titan', 'Leaf'],
  'Mazda': ['CX-5', 'CX-30', 'Mazda3', 'CX-50', 'CX-9', 'MX-5 Miata', 'CX-90'],
  'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'WRX', 'Ascent', 'Legacy'],
};

const priceRanges = [
  { label: 'Under $15,000', value: '0-15000' },
  { label: '$15,000 - $25,000', value: '15000-25000' },
  { label: '$25,000 - $40,000', value: '25000-40000' },
  { label: '$40,000 - $60,000', value: '40000-60000' },
  { label: '$60,000 - $100,000', value: '60000-100000' },
  { label: 'Over $100,000', value: '100000-999999' },
];

const carStyles = [
  { name: 'SUV', value: 'SUV' },
  { name: 'Sedan', value: 'SEDAN' },
  { name: 'Truck', value: 'PICKUP' },
  { name: 'Coupe', value: 'COUPE' },
  { name: 'Hatchback', value: 'HATCHBACK' },
  { name: 'Electric', value: 'ELECTRIC' },
  { name: 'Luxury', value: 'LUXURY' },
  { name: 'Convertible', value: 'CONVERTIBLE' },
];

export function SearchHero() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [condition, setCondition] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const t = useTranslations('home');
  const tSearch = useTranslations('search');
  const tCommon = useTranslations('common');

  // Get available models based on selected make
  const availableModels = useMemo(() => {
    if (!make) return [];
    return modelsByMake[make] || [];
  }, [make]);

  // Reset model when make changes
  useEffect(() => {
    setModel('');
  }, [make]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const setStartTime = () => {
        if (video.readyState >= 2) {
          video.currentTime = 42;
        }
      };

      const handleLoadedData = () => {
        video.currentTime = 42;
      };

      const handleCanPlay = () => {
        if (video.currentTime < 42) {
          video.currentTime = 42;
        }
      };

      const handleTimeUpdate = () => {
        if (video.currentTime < 42 && video.currentTime > 0 && video.currentTime < 1) {
          video.currentTime = 42;
        }
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('timeupdate', handleTimeUpdate);
      
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
    if (condition) params.set('condition', condition);
    if (make) params.set('make', make);
    if (model) params.set('model', model);
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      params.set('priceMin', min);
      params.set('priceMax', max);
    }
    if (postalCode) params.set('postalCode', postalCode);
    router.push(`/search?${params.toString()}`);
  };

  const handleStyleClick = (styleValue: string) => {
    if (styleValue === 'ELECTRIC') {
      router.push('/search?fuelType=ELECTRIC');
    } else if (styleValue === 'LUXURY') {
      router.push('/search?make=BMW&make=Mercedes-Benz&make=Audi&make=Lexus&make=Porsche');
    } else {
      router.push(`/search?bodyType=${styleValue}`);
    }
  };

  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        onLoadedData={(e) => {
          e.currentTarget.currentTime = 42;
        }}
        onCanPlay={(e) => {
          if (e.currentTarget.currentTime < 42) {
            e.currentTarget.currentTime = 42;
          }
        }}
        onEnded={(e) => {
          e.currentTarget.currentTime = 42;
          e.currentTarget.play();
        }}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src="/carvideo.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Mute Button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-24 right-6 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-white" />
        ) : (
          <Volume2 className="h-4 w-4 text-white" />
        )}
      </button>
      
      {/* Decorative Blurs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-10 z-10 h-72 w-72 rounded-full bg-coral-500/20 blur-3xl" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-20 right-10 z-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" 
      />

      <div className="container relative z-20 mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-coral-400" />
              <span>{t('heroSubtitle')}</span>
            </div>
            
            <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t('heroTitle')}
              <span className="block bg-gradient-to-r from-coral-400 to-coral-300 bg-clip-text text-transparent">
                Perfect Drive
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              {t('heroSubtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10"
          >
            <div className="mx-auto max-w-3xl rounded-2xl bg-white/95 p-3 shadow-2xl backdrop-blur-sm dark:bg-slate-900/95">
              <div className="grid gap-2 grid-cols-3 sm:grid-cols-6">
                {/* Condition */}
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="h-10 border-0 bg-slate-100 text-sm dark:bg-slate-800">
                    <SelectValue placeholder={tSearch('condition')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">{tSearch('new')}</SelectItem>
                    <SelectItem value="USED">{tSearch('used')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Make */}
                <Select value={make} onValueChange={setMake}>
                  <SelectTrigger className="h-10 border-0 bg-slate-100 text-sm dark:bg-slate-800">
                    <SelectValue placeholder={tSearch('make')} />
                  </SelectTrigger>
                  <SelectContent>
                    {popularMakes.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Model */}
                <Select value={model} onValueChange={setModel} disabled={!make}>
                  <SelectTrigger className="h-10 border-0 bg-slate-100 text-sm dark:bg-slate-800">
                    <SelectValue placeholder={tSearch('model')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Price Range */}
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-10 border-0 bg-slate-100 text-sm dark:bg-slate-800">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Postal Code */}
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                  placeholder="Postal"
                  className="h-10 border-0 bg-slate-100 text-sm dark:bg-slate-800"
                  maxLength={7}
                />

                <Button
                  className="h-10 gap-2 text-sm"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                  {tCommon('search')}
                </Button>
              </div>
            </div>

            {/* Browse by Car Styles */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {carStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => handleStyleClick(style.value)}
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white font-medium backdrop-blur-sm transition-all hover:bg-white hover:text-primary hover:border-white hover:scale-105"
                >
                  {style.name}
                </button>
              ))}
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
          className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
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
