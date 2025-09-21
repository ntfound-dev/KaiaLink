'use client';

import React from 'react';

interface Props { code: string; className?: string; }

/**
 * Share button: uses Web Share API when available,
 * otherwise opens LINE share URL as fallback.
 */
export default function ReferralShare({ code, className }: Props) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(code)}`
    : `?ref=${encodeURIComponent(code)}`;

  async function handleShare() {
    const title = 'Gabung ke KaiaLink';
    const text = `Gunakan kode referral saya: ${code}\nDapatkan bonus ketika mendaftar!`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (e) {
      // continue to fallback
    }
    // LINE share fallback (opens new tab)
    const payload = encodeURIComponent(`${title}\n${text}\n${url}`);
    window.open(`https://social-plugins.line.me/lineit/share?text=${payload}`, '_blank', 'noopener');
  }

  return (
    <button onClick={handleShare} aria-label="Bagikan" className={className ?? 'px-2'}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden><path d="M18 8a3 3 0 1 0-2.83-4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H17a3 3 0 0 0 1-5.83V8zM6.5 6h8.67A3 3 0 0 1 12 9a3 3 0 0 1-4-3zM17 18H6.5a.5.5 0 0 1-.5-.5V9.2A3 3 0 0 0 10 12a3 3 0 0 0 7-3v9z"/></svg>
    </button>
  );
}
