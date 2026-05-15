'use client';

import { useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Module-level cache for zero-latency session recovery
let globalCachedUser: User | null = null;
let hasInitializedSession = false;

/**
 * Persistent cache-first user hook.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(globalCachedUser);
  const [loading, setLoading] = useState(!hasInitializedSession);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      // Only trigger state update if user session changed
      if (u?.uid !== globalCachedUser?.uid || !hasInitializedSession) {
        globalCachedUser = u;
        setUser(u);
      }
      hasInitializedSession = true;
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  return { user, loading };
}
