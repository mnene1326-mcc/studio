'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * A hook that returns the current Firebase user and loading state.
 * It ensures a consistent loading state on the server and initial client render
 * to prevent hydration mismatches.
 */
export function useUser() {
  const auth = useAuth();
  
  // Start with loading: true to ensure SSR and initial client hydration match.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is the source of truth for auth state
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  return { user, loading };
}
