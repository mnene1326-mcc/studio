
'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

// Memory cache for user state to prevent flickering on tab switches
let cachedUser: User | null = null;
let isInitialized = false;

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!isInitialized);

  useEffect(() => {
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
