export const locales = ['en', 'tr', 'fr', 'es', 'tl', 'ar', 'uk'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  fr: 'Français',
  es: 'Español',
  tl: 'Tagalog',
  ar: 'العربية',
  uk: 'Українська',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  tr: '🇹🇷',
  fr: '🇫🇷',
  es: '🇪🇸',
  tl: '🇵🇭',
  ar: '🇸🇦',
  uk: '🇺🇦',
};

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

export const isRtlLocale = (locale: Locale) => rtlLocales.includes(locale);



