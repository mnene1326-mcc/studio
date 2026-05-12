
'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Memory cache for user state to prevent flickering on client-side navigation
let cachedUser: User | null = null;
let isInitialized = false;

export function useUser() {
  const auth = useAuth();
  
  // Always start with loading: true and user: null for the initial render
  // This ensures SSR and initial hydration match perfectly.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Once mounted on the client, we can immediately check the cache
    if (isInitialized) {
      setUser(cachedUser);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      cachedUser = u;
      isInitialized = true;
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  return { user, loading };
}
