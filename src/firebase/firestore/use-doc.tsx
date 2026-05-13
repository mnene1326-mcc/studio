
'use client';

import { useEffect, useState } from 'react';
import { DocumentReference, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

const docCache = new Map<string, any>();

export function useDoc<T = any>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(() => {
    if (ref && docCache.has(ref.path)) {
      return docCache.get(ref.path);
    }
    return null;
  });
  
  const [loading, setLoading] = useState(() => {
    if (ref && docCache.has(ref.path)) {
      return false;
    }
    return ref !== null;
  });
  
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
        
        docCache.set(ref.path, docData);
        
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
  }, [ref]);

  return { data, loading, error };
}
