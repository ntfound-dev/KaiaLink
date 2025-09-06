import { createI18nServer } from 'next-international/server';

/**
 * File ini membuat dan mengekspor fungsi-fungsi i18n
 * yang aman untuk digunakan di dalam Server Components, seperti Layouts dan Pages.
 */
export const { getCurrentLocale, getI18n, getScopedI18n } = createI18nServer({
  // Tautkan ke file "kamus" bahasa Anda
  id: () => import('./id'),
  en: () => import('./en'),
});
