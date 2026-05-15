import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services with optimizations for connectivity and performance.
 * - Firestore is configured with offline persistence to reduce reads and support offline use.
 * - experimentalForceLongPolling is used for compatibility in restricted environments.
 */
export function initializeFirebase(): {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
} {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  let firestore: Firestore;
  
  if (typeof window !== 'undefined') {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firestore = getFirestore(app);
    } else {
      firestore = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });

      // Enable Offline Persistence for Economy and Offline Mode
      enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistence failed: Browser not supported');
        }
      });
    }
  } else {
    firestore = getFirestore(app);
  }

  const auth = getAuth(app);
  const database = getDatabase(app, "https://studio-7077369434-1f94a-default-rtdb.europe-west1.firebasedatabase.app/");

  return { app, firestore, auth, database };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './firestore/use-memo-firebase';
