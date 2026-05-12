
'use client';

import { useEffect, useState } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

// Global cache to persist query results across navigation
const collectionCache = new Map<string, any[]>();

export function useCollection<T = any>(q: Query | null) {
  // Create a stable cache key based on the query path/structure
  const queryKey = q ? (q as any).path || (q as any)._query?.path?.segments?.join('/') || JSON.stringify((q as any)._query) : null;
  
  const [data, setData] = useState<T[]>(() => {
    if (queryKey && collectionCache.has(queryKey)) {
      return collectionCache.get(queryKey)!;
    }
    return [];
  });
  
  const [loading, setLoading] = useState(() => {
    if (queryKey && collectionCache.has(queryKey)) {
      return false; // Skip loading state if we have cached data
    }
    return q !== null;
  });
  
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as T),
        }));
        
        if (queryKey) {
          collectionCache.set(queryKey, items);
        }
        
        setData(items);
        setLoading(false);
      },
      (err) => {
        const path = (q as any).path || (q as any)._query?.path?.segments?.join('/') || 'collection';
        const permissionError = new FirestorePermissionError({
          path: path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [q, queryKey]);

  return { data, loading, error };
}
