
'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Module-level variable to persist user across tab switches/navigation
let cachedUser: User | null = null;
let hasInitialized = false;

/**
 * A hook that returns the current Firebase user and loading state.
 * Uses a persistent cache to prevent flickering during tab transitions.
 */
export function useUser() {
  const auth = useAuth();
  
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!hasInitialized);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      cachedUser = u;
      hasInitialized = true;
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  return { user, loading };
}
