
'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { useAuth, useDatabase, useUser } from '@/firebase';

/**
 * Hook to manage the current user's online presence in Realtime Database.
 */
export function usePresence() {
  const { user } = useUser();
  const database = useDatabase();

  useEffect(() => {
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
  }, [user, database]);
}

/**
 * Hook to listen to a specific user's presence state.
 */
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
      // Only set presence if state is actually 'online' to fulfill "don't show anything when off"
      if (data && data.state === 'online') {
        setPresence(data);
      } else {
        setPresence(null);
      }
    });

    return () => unsubscribe();
  }, [uid, database]);

  return presence;
}
