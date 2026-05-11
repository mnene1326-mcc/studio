'use client';

import { useMemo } from 'react';

/**
 * A custom hook to memoize Firebase references and queries.
 * It ensures that the same instance is returned as long as the dependencies don't change,
 * which prevents infinite loops in hooks like useCollection and useDoc.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
