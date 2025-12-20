'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from './Toaster';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        basePath="/api/auth"
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};

