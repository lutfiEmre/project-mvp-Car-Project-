'use client';

import Link from 'next/link';
import { Car, Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

const footerLinks = {
  browse: [
    { name: 'Search Cars', href: '/search' },
    { name: 'New Cars', href: '/search?condition=NEW' },
    { name: 'Used Cars', href: '/search?condition=USED' },
    { name: 'Certified Pre-Owned', href: '/search?condition=CERTIFIED_PRE_OWNED' },
    { name: 'Electric Vehicles', href: '/search?fuelType=ELECTRIC' },
  ],
  sell: [
    { name: 'Sell Your Car', href: '/sell' },
    { name: 'Dealer Sign Up', href: '/register?type=dealer' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Dealer Resources', href: '/dealer/resources' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Safety Tips', href: '/safety' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Accessibility', href: '/accessibility' },
  ],
};

const provinces = [
  'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba',
  'Saskatchewan', 'Nova Scotia', 'New Brunswick',
];

export function Footer() {
  const t = useTranslations('footer');
  
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-coral-500">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                DrivingAway
              </span>
            </Link>
            <p className="max-w-md text-slate-400">
              Canada&apos;s premier vehicle marketplace. Find your perfect car from thousands of listings by trusted dealers and private sellers across the country.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Toronto, Ontario, Canada</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>1-800-DRIVING</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>hello@drivingaway.ca</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
            <p className="text-slate-400">
              Subscribe to get the latest deals, new listings, and automotive news.
            </p>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button className="shrink-0">Subscribe</Button>
            </div>
          </div>
        </div>

        <Separator className="my-12 bg-slate-800" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-4 font-semibold text-white">Browse</h4>
            <ul className="space-y-2">
              {footerLinks.browse.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Sell</h4>
            <ul className="space-y-2">
              {footerLinks.sell.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-12 bg-slate-800" />

        <div>
          <h4 className="mb-4 font-semibold text-white">Browse by Province</h4>
          <div className="flex flex-wrap gap-3">
            {provinces.map((province) => (
              <Link
                key={province}
                href={`/search?province=${province}`}
                className="rounded-full bg-slate-800 px-4 py-1.5 text-sm hover:bg-slate-700 transition-colors"
              >
                {province}
              </Link>
            ))}
          </div>
        </div>

        <Separator className="my-12 bg-slate-800" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">{t('terms')}</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">{t('cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

