
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, Firestore, persistentLocalCache, persistentMultipleTabManager, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from './config';

// Global singletons to prevent multiple initializations
let firestoreInstance: Firestore | null = null;

/**
 * Initializes Firebase services with modern persistent cache settings.
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
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    }
  } else {
    firestoreInstance = initializeFirestore(app, {});
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
