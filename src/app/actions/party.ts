'use server';

import { initializeFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Creates a new voice party room in Firestore.
 */
export async function createPartyRoomAction(ownerUid: string, roomName: string) {
  const { firestore: db } = initializeFirebase();

  try {
    // 1. Get owner details for metadata
    const ownerSnap = await getDoc(doc(db, "users", ownerUid));
    if (!ownerSnap.exists()) return { success: false, error: "User profile not found." };
    
    const ownerData = ownerSnap.data();

    // 2. Generate a unique 6-digit Room ID
    let roomId = "";
    let isUnique = false;
    while (!isUnique) {
      roomId = Math.floor(100000 + Math.random() * 899999).toString();
      const check = await getDoc(doc(db, "rooms", roomId));
      if (!check.exists()) isUnique = true;
    }

    // 3. Save Room to Firestore
    const roomRef = doc(db, "rooms", roomId);
    await setDoc(roomRef, {
      id: roomId,
      name: roomName || `${ownerData.name}'s Party`,
      ownerUid: ownerUid,
      hostName: ownerData.name,
      hostPhoto: ownerData.photoURL,
      createdAt: serverTimestamp(),
      onlineCount: 1, // Creator is the first one in
      hot: "0"
    });

    return { success: true, roomId };
  } catch (error: any) {
    console.error("Create Room Error:", error);
    return { success: false, error: error.message };
  }
}
