
'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Client-only cache to prevent flickering during tab navigation
// We use a global variable that is only initialized on the client side
let cachedUser: User | null = null;
let hasInitialized = false;

/**
 * A hook that returns the current Firebase user and loading state.
 * Uses a persistent client-side cache to prevent flickering during transitions.
 */
export function useUser() {
  const auth = useAuth();
  
  // Initialize state from cache if available (only on client)
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') return cachedUser;
    return null;
  });
  
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') return !hasInitialized;
    return true;
  });

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
