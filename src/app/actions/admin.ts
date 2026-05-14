
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Awards coins to a user based on their numeric MatchFlow ID.
 * Admins have unlimited awarding power.
 * CoinSellers have the amount deducted from their own balance.
 */
export async function awardCoinsAction(callerUid: string, targetMatchFlowId: string, amount: number) {
  const { firestore: db } = initializeFirebase();

  try {
    // 1. Verify caller privileges
    const callerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", callerUid)));
    
    if (callerSnap.empty) {
      return { success: false, error: "Caller profile not found." };
    }
    
    const callerDoc = callerSnap.docs[0];
    const callerData = callerDoc.data();
    
    if (!callerData.isAdmin && !callerData.isCoinSeller) {
      return { success: false, error: "Unauthorized. Insufficient privileges." };
    }

    // 2. Logic for CoinSellers (deduction)
    if (callerData.isCoinSeller && !callerData.isAdmin) {
      const currentBalance = callerData.coins || 0;
      if (currentBalance < amount) {
        return { success: false, error: `Insufficient balance. You have ${currentBalance} coins.` };
      }
      
      // Deduct from seller
      await updateDoc(doc(db, "users", callerDoc.id), {
        coins: increment(-amount),
        updatedAt: serverTimestamp()
      });
    }

    // 3. Find target user by numeric ID
    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);

    if (targetSnap.empty) {
      return { success: false, error: "User with this ID not found." };
    }

    const targetDoc = targetSnap.docs[0];
    const targetRef = doc(db, "users", targetDoc.id);
    const targetData = targetDoc.data();

    // 4. Award coins to target
    await updateDoc(targetRef, {
      coins: increment(amount),
      updatedAt: serverTimestamp()
    });

    return { 
      success: true, 
      message: `Successfully awarded ${amount} coins to ${targetData.name || targetMatchFlowId}.`,
      targetName: targetData.name
    };
  } catch (error: any) {
    console.error("Award Coins Error:", error);
    return { success: false, error: error.message || "Failed to award coins." };
  }
}
