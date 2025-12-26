'use client';

import { Settings, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function MaintenancePage() {
  const t = useTranslations('maintenance');
  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: () => api.admin.getMaintenanceMode(),
  });

  const message = maintenanceData?.maintenanceMessage || t('defaultMessage');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center px-4 max-w-2xl">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
            <Settings className="h-12 w-12 text-primary animate-spin" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-6">
            <Clock className="h-5 w-5" />
            <p className="text-lg">{t('subtitle')}</p>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <p className="text-slate-300 text-lg leading-relaxed">
            {message}
          </p>
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <p>{t('thankYou')}</p>
        </div>
      </div>
    </div>
  );
}

