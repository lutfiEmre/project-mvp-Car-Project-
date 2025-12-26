'use client';

import Link from 'next/link';
import { Car, Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  
  const footerLinks = {
    browse: [
      { name: t('searchCars'), href: '/search' },
      { name: t('newCars'), href: '/search?condition=NEW' },
      { name: t('usedCars'), href: '/search?condition=USED' },
      { name: t('certifiedPreOwned'), href: '/search?condition=CERTIFIED_PRE_OWNED' },
      { name: t('electricVehicles'), href: '/search?fuelType=ELECTRIC' },
    ],
    sell: [
      { name: t('sellYourCar'), href: '/sell' },
      { name: t('dealerSignUp'), href: '/register?type=dealer' },
      { name: t('pricing'), href: '/pricing' },
      { name: t('dealerResources'), href: '/dealer/resources' },
    ],
    company: [
      { name: t('aboutUs'), href: '/about' },
      { name: t('careers'), href: '/careers' },
      { name: t('press'), href: '/press' },
      { name: t('contact'), href: '/contact' },
      { name: t('blog'), href: '/blog' },
    ],
    support: [
      { name: t('help'), href: '/help' },
      { name: t('safetyTips'), href: '/safety' },
      { name: t('terms'), href: '/terms' },
      { name: t('privacy'), href: '/privacy' },
      { name: t('accessibility'), href: '/accessibility' },
    ],
  };

const provinces = [
  'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba',
  'Saskatchewan', 'Nova Scotia', 'New Brunswick',
];

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
              {t('companyDescription')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{t('location')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>{t('phone')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>{t('email')}</span>
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
            <h3 className="text-lg font-semibold text-white">{t('stayUpdated')}</h3>
            <p className="text-slate-400">
              {t('subscribeDesc')}
            </p>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder={t('enterEmail')}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button className="shrink-0">{t('subscribe')}</Button>
            </div>
          </div>
        </div>

        <Separator className="my-12 bg-slate-800" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-4 font-semibold text-white">{t('browseTitle')}</h4>
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
            <h4 className="mb-4 font-semibold text-white">{t('sellTitle')}</h4>
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
            <h4 className="mb-4 font-semibold text-white">{t('companyTitle')}</h4>
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
            <h4 className="mb-4 font-semibold text-white">{t('supportTitle')}</h4>
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
          <h4 className="mb-4 font-semibold text-white">{t('browseByProvince')}</h4>
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

