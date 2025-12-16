'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Building2, MapPin, Star, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Featured dealers data
const featuredDealers = [
  {
    id: '1',
    businessName: 'Premium Auto Gallery',
    city: 'Toronto',
    province: 'Ontario',
    rating: 4.8,
    reviewCount: 234,
    totalListings: 156,
    totalSold: 320,
    verified: true,
    slug: 'premium-auto-gallery',
    specialty: 'Luxury & Exotic',
    image: 'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80',
  },
  {
    id: '2',
    businessName: 'Pacific Motors',
    city: 'Vancouver',
    province: 'British Columbia',
    rating: 4.9,
    reviewCount: 189,
    totalListings: 98,
    totalSold: 245,
    verified: true,
    slug: 'pacific-motors',
    specialty: 'Electric & Hybrid',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
  },
  {
    id: '3',
    businessName: 'Prairie Auto Group',
    city: 'Calgary',
    province: 'Alberta',
    rating: 4.7,
    reviewCount: 156,
    totalListings: 203,
    totalSold: 412,
    verified: true,
    slug: 'prairie-auto-group',
    specialty: 'Trucks & SUVs',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
  },
  {
    id: '4',
    businessName: 'Montreal Premium Cars',
    city: 'Montreal',
    province: 'Quebec',
    rating: 4.6,
    reviewCount: 142,
    totalListings: 124,
    totalSold: 298,
    verified: true,
    slug: 'montreal-premium-cars',
    specialty: 'European Brands',
    image: 'https://images.unsplash.com/photo-1494976687768-f90e2aafa327?w=800&q=80',
  },
  {
    id: '5',
    businessName: 'Ottawa Auto Exchange',
    city: 'Ottawa',
    province: 'Ontario',
    rating: 4.5,
    reviewCount: 178,
    totalListings: 167,
    totalSold: 289,
    verified: true,
    slug: 'ottawa-auto-exchange',
    specialty: 'Family Vehicles',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80',
  },
  {
    id: '6',
    businessName: 'Edmonton Motors',
    city: 'Edmonton',
    province: 'Alberta',
    rating: 4.7,
    reviewCount: 201,
    totalListings: 189,
    totalSold: 356,
    verified: true,
    slug: 'edmonton-motors',
    specialty: 'Pre-Owned Certified',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
  },
];

export function FeaturedDealers() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Featured Dealers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Discover trusted dealerships across Canada with verified inventory and exceptional service
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredDealers.map((dealer, index) => (
            <motion.div
              key={dealer.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-xl dark:border-slate-800"
            >
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-coral-500/20">
                <img
                  src={dealer.image}
                  alt={dealer.businessName}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {dealer.verified && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-xl font-bold text-white drop-shadow-lg">
                    {dealer.businessName}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-white/90">
                    <MapPin className="h-3 w-3" />
                    {dealer.city}, {dealer.province}
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="mb-3">
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20">
                    {dealer.specialty}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{dealer.rating}</span>
                    <span className="text-sm text-muted-foreground">({dealer.reviewCount})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dealer.totalListings} listings
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{dealer.totalSold}+ vehicles sold</span>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-lg">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                  <Link href={`/dealers/${dealer.slug}`} className="flex-1">
                    <Button size="sm" className="w-full rounded-lg">
                      View Inventory
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/dealers">
            <Button variant="outline" size="lg" className="rounded-xl">
              View All Dealers
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}


