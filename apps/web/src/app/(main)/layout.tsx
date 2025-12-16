'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user || undefined} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

