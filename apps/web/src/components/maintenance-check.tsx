'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

export function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: () => api.admin.getMaintenanceMode(),
    refetchInterval: 30000, // Her 30 saniyede bir kontrol et
    retry: 1,
  });

  // Only run on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run after component is mounted (client-side)
    if (!mounted) return;
    
    // Loading durumunda bekle
    if (authLoading || maintenanceLoading) {
      return;
    }

    if (maintenanceData) {
      const isMaintenanceMode = maintenanceData.maintenanceMode === true;
      
      // Admin kullanıcıları maintenance mode'dan etkilenmez
      const isAdmin = user?.role === 'ADMIN';
      
      if (isMaintenanceMode && !isAdmin) {
        // Admin paneli, login, register ve maintenance sayfası hariç tüm sayfaları kontrol et
        const allowedPaths = ['/maintenance', '/login', '/register'];
        const isAllowedPath = allowedPaths.includes(pathname) || pathname.startsWith('/admin');
        
        if (!isAllowedPath) {
          router.replace('/maintenance');
        }
      } else if (!isMaintenanceMode && pathname === '/maintenance') {
        // Maintenance mode kapalıysa ve maintenance sayfasındaysa ana sayfaya yönlendir
        router.replace('/');
      }
    }
  }, [mounted, maintenanceData, pathname, router, user, authLoading, maintenanceLoading]);

  // Maintenance mode aktifse ve admin değilse, maintenance sayfasını göster
  if (mounted && !authLoading && !maintenanceLoading && maintenanceData?.maintenanceMode && user?.role !== 'ADMIN' && pathname !== '/maintenance' && pathname !== '/login' && pathname !== '/register' && !pathname.startsWith('/admin')) {
    router.replace('/maintenance');
    return null;
  }

  return <>{children}</>;
}

