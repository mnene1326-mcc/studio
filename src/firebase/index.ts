import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services with optimizations for connectivity and performance.
 * - Firestore is configured with long polling to fix issues in restricted network environments.
 * - RTDB is configured with the project-specific database URL.
 */
export function initializeFirebase(): {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
} {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  let firestore: Firestore;
  
  // Use experimentalForceLongPolling specifically on the client to fix backend reachability issues.
  if (typeof window !== 'undefined') {
    try {
      firestore = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } catch (e) {
      // If Firestore was already initialized (e.g. during Hot Module Replacement), get the existing instance.
      firestore = getFirestore(app);
    }
  } else {
    // Server-side initialization
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
