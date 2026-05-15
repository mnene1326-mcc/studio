'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

const getCacheKey = (q: Query | null) => {
  if (!q) return null;
  const path = (q as any)._query?.path?.segments?.join('_') || 'unknown';
  return `fs_coll_${path}`;
};

/**
 * Optimized cache-first collection hook.
 */
export function useCollection<T = any>(q: Query | null) {
  const queryKey = useMemo(() => getCacheKey(q), [q]);
  const isInitialMount = useRef(true);
  
  const [data, setData] = useState<T[]>(() => {
    if (typeof window !== 'undefined' && queryKey) {
      const cached = localStorage.getItem(queryKey);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { return []; }
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(q !== null && data.length === 0);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }

    // Optimization: disable metadata changes to reduce noise and costs
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as T),
        }));
        
        if (queryKey) {
          const currentStr = JSON.stringify(items);
          const cachedStr = localStorage.getItem(queryKey);
          
          if (currentStr !== cachedStr || isInitialMount.current) {
            localStorage.setItem(queryKey, currentStr);
            setData(items);
          }
        }
        
        setLoading(false);
        isInitialMount.current = false;
      },
      (err) => {
        const path = (q as any)._query?.path?.segments?.join('/') || 'collection';
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: path,
            operation: 'list',
          }));
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q, queryKey]);

  return { data, loading };
}
