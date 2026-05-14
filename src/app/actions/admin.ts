
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Awards coins to a user based on their numeric MatchFlow ID.
 * Only callable by users with isAdmin or isCoinSeller privileges.
 */
export async function awardCoinsAction(callerUid: string, targetMatchFlowId: string, amount: number) {
  const { firestore: db } = initializeFirebase();

  try {
    // 1. Verify caller privileges
    const callerRef = doc(db, "users", callerUid);
    const callerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", callerUid)));
    
    if (callerSnap.empty) {
      return { success: false, error: "Caller profile not found." };
    }
    
    const callerData = callerSnap.docs[0].data();
    if (!callerData.isAdmin && !callerData.isCoinSeller) {
      return { success: false, error: "Unauthorized. Insufficient privileges." };
    }

    // 2. Find target user by numeric ID
    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);

    if (targetSnap.empty) {
      return { success: false, error: "User with this ID not found." };
    }

    const targetDoc = targetSnap.docs[0];
    const targetRef = doc(db, "users", targetDoc.id);

    // 3. Award coins
    await updateDoc(targetRef, {
      coins: increment(amount),
      updatedAt: serverTimestamp()
    });

    return { 
      success: true, 
      message: `Successfully awarded ${amount} coins to ${targetData.name || targetMatchFlowId}.`,
      targetName: targetDoc.data().name
    };
  } catch (error: any) {
    console.error("Award Coins Error:", error);
    return { success: false, error: error.message || "Failed to award coins." };
  }
}
