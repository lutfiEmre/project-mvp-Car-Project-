'use client';

import { SearchHero } from '@/components/search/search-hero';
import { FeaturedListings } from '@/components/home/featured-listings';
import { PopularMakes } from '@/components/home/popular-makes';
import { BuyingPower } from '@/components/home/buying-power';
import { FeaturedDealers } from '@/components/home/featured-dealers';
import { WhyCarhaus } from '@/components/home/why-carhaus';
import { CTASection } from '@/components/home/cta-section';
import { ScrollSection } from '@/components/home/scroll-section';

// Preload 3D model when page loads
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/chevrolet_colorado_zr2.glb';
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export default function HomePage() {
  return (
    <>
      <SearchHero />
      <ScrollSection delay={0}>
        <FeaturedListings />
      </ScrollSection>
      <ScrollSection delay={0}>
        <PopularMakes />
      </ScrollSection>
      <ScrollSection delay={0}>
        <BuyingPower />
      </ScrollSection>
      <ScrollSection delay={0}>
        <FeaturedDealers />
      </ScrollSection>
      <ScrollSection delay={0}>
        <WhyCarhaus />
      </ScrollSection>
      <ScrollSection delay={0}>
        <CTASection />
      </ScrollSection>
    </>
  );
}
