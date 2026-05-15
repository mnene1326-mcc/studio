import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services with aggressive offline persistence.
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
    firestore = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
    });

    // Enable Offline Persistence for zero-latency local data access
    enableIndexedDbPersistence(firestore).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Persistence failed: Browser not supported');
      }
    });
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
