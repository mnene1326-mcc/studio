
'use client';

import { useEffect, useState } from 'react';
import { DocumentReference, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

const getCacheKey = (ref: DocumentReference | null) => {
  if (!ref) return null;
  return `firestore_cache_doc_${ref.path.replace(/\//g, '_')}`;
};

export function useDoc<T = any>(ref: DocumentReference | null) {
  const queryKey = getCacheKey(ref);

  const [data, setData] = useState<T | null>(() => {
    if (typeof window !== 'undefined' && queryKey) {
      const cached = localStorage.getItem(queryKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(ref !== null && data === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const docData = snapshot.exists() ? (snapshot.data() as T) : null;
        
        if (queryKey) {
          localStorage.setItem(queryKey, JSON.stringify(docData));
        }
        
        setData(docData);
        setLoading(false);
      },
      (err) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          console.error(`Firestore Error (${ref.path}):`, err);
        }
        
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [ref, queryKey]);

  return { data, loading, error };
}
