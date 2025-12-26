'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, MapPin, Gauge, Fuel, Calendar, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, formatMileage } from '@/lib/utils';
import type { Listing } from '@carhaus/types';
import { useTranslations } from 'next-intl';

interface VehicleCardProps {
  listing: Listing;
  index?: number;
  saved?: boolean;
  onSave?: (id: string) => void;
}

export function VehicleCard({ listing, index = 0, saved = false, onSave }: VehicleCardProps) {
  const t = useTranslations('vehicle');
  const tCommon = useTranslations('common');
  const primaryImage = listing.media?.find(m => m.isPrimary)?.url || listing.media?.[0]?.url || '/placeholder-car.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/vehicles/${listing.slug}`}>
        <Card className="group overflow-hidden h-full hover-lift card-shine">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={primaryImage}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {listing.featured && (
                <Badge className="bg-coral-500 text-white">{tCommon('featured')}</Badge>
              )}
              {listing.condition === 'NEW' && (
                <Badge className="bg-emerald-500 text-white">{t('new')}</Badge>
              )}
              {listing.condition === 'CERTIFIED_PRE_OWNED' && (
                <Badge className="bg-primary text-white">
                  <Check className="mr-1 h-3 w-3" />
                  {t('certified')}
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/90 text-slate-900 hover:bg-white hover:scale-110 transition-all"
              onClick={(e) => {
                e.preventDefault();
                onSave?.(listing.id);
              }}
            >
              <Heart className={saved ? "h-5 w-5 fill-coral-500 text-coral-500" : "h-5 w-5"} />
            </Button>

            <div className="absolute bottom-3 left-3 right-3">
              <p className="font-display text-2xl font-bold text-white drop-shadow-lg">
                {formatPrice(listing.price)}
              </p>
              {listing.originalPrice && listing.originalPrice > listing.price && (
                <p className="text-sm text-white/70 line-through">
                  {formatPrice(listing.originalPrice)}
                </p>
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-display text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {listing.year} {listing.make} {listing.model}
            </h3>
            {listing.trim && (
              <p className="text-sm text-muted-foreground">{listing.trim}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Gauge className="h-4 w-4" />
                <span>{formatMileage(listing.mileage)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4" />
                <span>{listing.fuelType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{listing.year}</span>
              </div>
            </div>

            {listing.city && (
              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{listing.city}, {listing.province}</span>
              </div>
            )}

            {listing.dealer && (
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xs font-bold text-primary">
                    {listing.dealer.businessName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{listing.dealer.businessName}</p>
                  {listing.dealer.verified && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="h-3 w-3" />
                      {t('verifiedDealer')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

