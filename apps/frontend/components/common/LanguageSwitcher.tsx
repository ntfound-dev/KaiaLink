'use client';
import { useChangeLocale, useCurrentLocale } from '@/locales/client';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const changeLocale = useChangeLocale();
  const locale = useCurrentLocale();

  return (
    <div className="flex items-center gap-2">
      <Languages className="w-5 h-5 text-gray-500" />
      <button 
        onClick={() => changeLocale('id')} 
        disabled={locale === 'id'}
        className="disabled:opacity-100 disabled:font-bold font-semibold text-gray-500"
      >
        ID
      </button>
      <span className="text-gray-300">|</span>
      <button 
        onClick={() => changeLocale('en')} 
        disabled={locale === 'en'}
        className="disabled:opacity-100 disabled:font-bold font-semibold text-gray-500"
      >
        EN
      </button>
    </div>
  );
}