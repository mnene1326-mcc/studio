'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { DocumentReference, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

const getCacheKey = (ref: DocumentReference | null) => {
  if (!ref) return null;
  return `fs_doc_${ref.path.replace(/\//g, '_')}`;
};

/**
 * Optimized cache-first document hook.
 * Uses local storage for instant rendering and background synchronization.
 */
export function useDoc<T = any>(ref: DocumentReference | null) {
  const queryKey = useMemo(() => getCacheKey(ref), [ref]);
  const isInitialMount = useRef(true);

  const [data, setData] = useState<T | null>(() => {
    if (typeof window !== 'undefined' && queryKey) {
      const cached = localStorage.getItem(queryKey);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { return null; }
      }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(ref !== null && data === null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    // Single listener for background sync
    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snapshot) => {
        const docData = snapshot.exists() ? (snapshot.data() as T) : null;
        
        if (docData !== undefined) {
          if (queryKey) {
            const currentStr = JSON.stringify(docData);
            const cachedStr = localStorage.getItem(queryKey);
            
            // Only trigger state update if data actually changed to stop "double loading"
            if (currentStr !== cachedStr || isInitialMount.current) {
              localStorage.setItem(queryKey, currentStr);
              setData(docData);
            }
          }
        }
        
        setLoading(false);
        isInitialMount.current = false;
      },
      (err) => {
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          }));
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref, queryKey]);

  return { data, loading };
}
