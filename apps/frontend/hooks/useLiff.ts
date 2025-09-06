'use client';

import { useState, useEffect } from 'react';
import type { Liff } from '@line/liff';

/**
 * Hook untuk mengelola siklus hidup LIFF SDK.
 * Menangani inisialisasi, status login, dan pengambilan profil dari LINE.
 */
export const useLiff = () => {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Import LIFF di sisi klien untuk menghindari error saat Server-Side Rendering.
    import('@line/liff')
      .then((liffModule) => liffModule.default)
      .then((liff) => {
        console.log('Menginisialisasi LIFF...');
        liff
          .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
          .then(() => {
            setLiffObject(liff);
            if (liff.isLoggedIn()) {
              setIsLoggedIn(true);
              liff.getProfile().then(setProfile).finally(() => setIsLoading(false));
            } else {
              setIsLoading(false);
            }
          })
          .catch((e: Error) => {
            setError(`Inisialisasi LIFF gagal: ${e.message}`);
            setIsLoading(false);
          });
      });
  }, []);

  const login = () => {
    liffObject?.login();
  };

  const logout = () => {
    liffObject?.logout();
    setIsLoggedIn(false);
    setProfile(null);
  };

  return { liffObject, profile, isLoggedIn, login, logout, error, isLoading };
};