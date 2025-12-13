'use client';

import { SearchHero } from '@/components/search/search-hero';
import { FeaturedListings } from '@/components/home/featured-listings';
import { BrowseByType } from '@/components/home/browse-by-type';
import { FeaturedDealers } from '@/components/home/featured-dealers';
import { WhyCarhaus } from '@/components/home/why-carhaus';
import { CTASection } from '@/components/home/cta-section';
import { ScrollSection } from '@/components/home/scroll-section';

export default function HomePage() {
  return (
    <>
      <SearchHero />
      <ScrollSection delay={0}>
        <FeaturedListings />
      </ScrollSection>
      <ScrollSection delay={0}>
        <BrowseByType />
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

