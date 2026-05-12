'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Client-only cache to prevent flickering during tab navigation
let cachedUser: User | null = null;
let hasInitialized = false;

/**
 * A hook that returns the current Firebase user and loading state.
 * Stabilized for Next.js hydration by ensuring initial state is consistent.
 */
export function useUser() {
  const auth = useAuth();
  
  // Always start with loading: true on the server and first client pass to prevent hydration mismatch
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have cached data on the client, use it immediately after mount
    if (hasInitialized) {
      setUser(cachedUser);
      setLoading(false);
    }

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
