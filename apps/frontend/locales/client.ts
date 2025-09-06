'use client';
import { createI18nClient } from 'next-international/client';

/**
 * File ini membuat dan mengekspor semua hooks i18n
 * yang aman untuk digunakan di dalam Client Components.
 */
export const {
  useI18n,
  useScopedI18n,
  I18nProviderClient,
  useChangeLocale,
  useCurrentLocale,
} = createI18nClient({
  // Tautkan ke file "kamus" bahasa Anda
  id: () => import('./id'),
  en: () => import('./en'),
});

