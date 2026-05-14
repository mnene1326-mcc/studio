'use client';

import { useEffect } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { useAuth, useDatabase } from '@/firebase';

export function usePresence() {
  const auth = useAuth();
  const database = useDatabase();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userStatusDatabaseRef = ref(database, `/status/${user.uid}`);
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;

      onDisconnect(userStatusDatabaseRef)
        .set({
          state: 'offline',
          last_changed: serverTimestamp(),
        })
        .then(() => {
          set(userStatusDatabaseRef, {
            state: 'online',
            last_changed: serverTimestamp(),
          });
        });
    });

    return () => {
      unsubscribe();
    };
  }, [auth.currentUser, database]);
}

import { useState } from 'react';

export function useUserPresence(uid: string | undefined) {
  const database = useDatabase();
  const [presence, setPresence] = useState<{ state: string; last_changed: number } | null>(null);

  useEffect(() => {
    if (!uid) {
      setPresence(null);
      return;
    }

    const statusRef = ref(database, `/status/${uid}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      setPresence(data);
    });

    return () => unsubscribe();
  }, [uid, database]);

  return presence;
}
