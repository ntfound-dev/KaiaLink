// apps/frontend/app/providers.tsx
import dynamic from 'next/dynamic';
import React, { ReactNode } from 'react';

// pastikan ./client-providers default-export sebuah client component (lihat di bawah)
const ClientProviders = dynamic(() => import('./client-providers'), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
