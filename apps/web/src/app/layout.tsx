import type { Metadata } from 'next';
import { Outfit, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { MaintenanceCheck } from '@/components/maintenance-check';
import { ServiceWorkerCleanup } from '@/components/service-worker-cleanup';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { isRtlLocale, type Locale } from '@/i18n/config';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-cabinet',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DrivingAway | Find Your Perfect Vehicle',
  description: 'Premium vehicle marketplace for Canada. Browse thousands of new and used cars from trusted dealers and private sellers.',
  keywords: ['cars', 'vehicles', 'automotive', 'canada', 'used cars', 'new cars', 'dealers'],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRtl = isRtlLocale(locale as Locale);

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${outfit.variable} ${sora.variable} font-sans`}>
        <ServiceWorkerCleanup />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <MaintenanceCheck>
              {children}
            </MaintenanceCheck>
            <Toaster richColors position="top-right" />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
