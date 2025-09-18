// apps/frontend/app/providers.tsx
import dynamic from 'next/dynamic';
import React from 'react';

// client-providers.tsx should be a client component (starts with 'use client')
// We dynamically import it with ssr: false so Next won't try to bundle any client-only wallet libs for the server.
const ClientProviders = dynamic(() => import('./client-providers'), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}

export { Providers };
