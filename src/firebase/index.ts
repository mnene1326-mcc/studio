import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from './config';

// Global singletons to prevent multiple initializations and persistence errors
let firestoreInstance: Firestore | null = null;
let persistenceStarted = false;

/**
 * Initializes Firebase services with robust offline persistence.
 * Ensures persistence is enabled before any other Firestore operations.
 */
export function initializeFirebase(): {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
} {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  if (typeof window !== 'undefined') {
    if (!firestoreInstance) {
      firestoreInstance = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      });

      if (!persistenceStarted) {
        persistenceStarted = true;
        // Persistence must be enabled BEFORE any other firestore calls
        enableIndexedDbPersistence(firestoreInstance).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            console.warn('Persistence failed: Browser not supported');
          }
        });
      }
    }
  } else {
    firestoreInstance = getFirestore(app);
  }

  const auth = getAuth(app);
  const database = getDatabase(app, "https://studio-7077369434-1f94a-default-rtdb.europe-west1.firebasedatabase.app/");

  return { app, firestore: firestoreInstance!, auth, database };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './firestore/use-memo-firebase';
