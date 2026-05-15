
'use client';

import { useEffect, useState, useRef } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

const getCacheKey = (q: Query | null) => {
  if (!q) return null;
  // Use the underlying query path segments for a unique key
  const path = (q as any)._query?.path?.segments?.join('_') || 'unknown';
  return `firestore_cache_coll_${path}`;
};

/**
 * Optimized hook for collection fetching.
 * Uses Firestore persistence and local storage for instant offline availability.
 */
export function useCollection<T = any>(q: Query | null) {
  const queryKey = getCacheKey(q);
  const hasInitialLoad = useRef(false);
  
  const [data, setData] = useState<T[]>(() => {
    if (typeof window !== 'undefined' && queryKey) {
      const cached = localStorage.getItem(queryKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(q !== null && data.length === 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as T),
        }));
        
        if (queryKey && items.length > 0) {
          localStorage.setItem(queryKey, JSON.stringify(items));
        }
        
        setData(items);
        setLoading(false);
        hasInitialLoad.current = true;
      },
      (err) => {
        const path = (q as any)._query?.path?.segments?.join('/') || 'collection';
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q, queryKey]);

  return { data, loading, error };
}
