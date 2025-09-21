'use client';

import React, { useEffect, useState } from 'react';
import { getCookie, setCookie } from '@/utils/cookies';

export default function SignupReferralInput({ name = 'referralCode', visible = false } : { name?: string; visible?: boolean }) {
  const [code, setCode] = useState<string>('');

  useEffect(() => {
    const c = getCookie('kaia_referral') ?? '';
    setCode(c);
  }, []);

  useEffect(() => {
    if (code) setCookie('kaia_referral', code, 60 * 60 * 24 * 30);
  }, [code]);

  if (visible) {
    return (
      <div className="my-3">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">Kode Referral (opsional)</label>
        <input id={name} name={name} value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>
    );
  }

  return <input type="hidden" name={name} value={code} readOnly />;
}
