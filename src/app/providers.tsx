
'use client';

import React from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import { usePresence } from '@/hooks/use-presence';
import { InstallPrompt } from '@/components/layout/InstallPrompt';

function PresenceManager({ children }: { children: React.ReactNode }) {
  usePresence();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <PresenceManager>
        <div className="native-page-transition flex-1 flex flex-col">
          {children}
        </div>
        <Toaster />
        <InstallPrompt />
      </PresenceManager>
    </FirebaseClientProvider>
  );
}
