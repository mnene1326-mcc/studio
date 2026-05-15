import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, terminate } from 'firebase/firestore';
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
  
  if (typeof window !== 'undefined') {
    // On the client, we ensure we only initialize firestore once with the correct settings
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firestore = getFirestore(app);
    } else {
      firestore = initializeFirestore(app, {
        experimentalForceLongPolling: true,
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
