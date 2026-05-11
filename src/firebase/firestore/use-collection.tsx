'use client';

import { useEffect, useState } from 'react';
import { Query, onSnapshot, CollectionReference } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = any>(q: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
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
        setData(items);
        setLoading(false);
      },
      (err) => {
        // Attempt to extract path if it's a collection reference
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
  }, [q]);

  return { data, loading, error };
}
