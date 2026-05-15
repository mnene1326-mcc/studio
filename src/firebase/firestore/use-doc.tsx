'use client';

import { useEffect, useState, useRef } from 'react';
import { DocumentReference, onSnapshot, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

const getCacheKey = (ref: DocumentReference | null) => {
  if (!ref) return null;
  return `firestore_cache_doc_${ref.path.replace(/\//g, '_')}`;
};

/**
 * Optimized hook for single document fetching.
 * Prioritizes local cache for instant UI and falls back to server if needed.
 */
export function useDoc<T = any>(ref: DocumentReference | null) {
  const queryKey = getCacheKey(ref);
  const hasLoadedFromServer = useRef(false);

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

    // Use onSnapshot which internally handles the "Offline First" logic of Firestore
    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snapshot) => {
        const docData = snapshot.exists() ? (snapshot.data() as T) : null;
        
        // Only update local storage and state if we have actual data
        if (docData !== undefined) {
          if (queryKey) {
            localStorage.setItem(queryKey, JSON.stringify(docData));
          }
          setData(docData);
        }
        
        // If the data came from the cache and we haven't synced yet, 
        // Firestore will eventually trigger another snapshot from server.
        if (!snapshot.metadata.fromCache) {
          hasLoadedFromServer.current = true;
        }
        
        setLoading(false);
      },
      (err) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref, queryKey]);

  return { data, loading, error };
}
