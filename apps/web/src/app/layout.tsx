import type { Metadata } from 'next';
import { Outfit, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { MaintenanceCheck } from '@/components/maintenance-check';

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
  title: 'CarHaus | Find Your Perfect Vehicle',
  description: 'Premium vehicle marketplace for Canada. Browse thousands of new and used cars from trusted dealers and private sellers.',
  keywords: ['cars', 'vehicles', 'automotive', 'canada', 'used cars', 'new cars', 'dealers'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${sora.variable} font-sans`}>
        <Providers>
          <MaintenanceCheck>
            {children}
          </MaintenanceCheck>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

