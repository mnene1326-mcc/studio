
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
    const callerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", callerUid)));
    if (callerSnap.empty) return { success: false, error: "Caller profile not found." };
    
    const callerDoc = callerSnap.docs[0];
    const callerData = callerDoc.data();
    
    if (!callerData.isAdmin && !callerData.isCoinSeller) {
      return { success: false, error: "Unauthorized." };
    }

    if (callerData.isCoinSeller && !callerData.isAdmin) {
      const currentBalance = callerData.coins || 0;
      if (currentBalance < amount) {
        return { success: false, error: `Insufficient balance. You have ${currentBalance} coins.` };
      }
      await updateDoc(doc(db, "users", callerDoc.id), {
        coins: increment(-amount),
        updatedAt: serverTimestamp()
      });
    }

    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);
    if (targetSnap.empty) return { success: false, error: "User with this ID not found." };

    const targetDoc = targetSnap.docs[0];
    await updateDoc(doc(db, "users", targetDoc.id), {
      coins: increment(amount),
      updatedAt: serverTimestamp()
    });

    return { success: true, message: `Successfully awarded ${amount} coins.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Allows an Admin to toggle roles for a user.
 */
export async function toggleUserRoleAction(callerUid: string, targetMatchFlowId: string, role: 'isCoinSeller' | 'isAgent', value: boolean) {
  const { firestore: db } = initializeFirebase();

  try {
    const callerSnap = await getDocs(query(collection(db, "users"), where("uid", "==", callerUid)));
    if (callerSnap.empty || !callerSnap.docs[0].data().isAdmin) {
      return { success: false, error: "Unauthorized. Only Admins can manage roles." };
    }

    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);
    if (targetSnap.empty) return { success: false, error: "User not found." };

    const targetDoc = targetSnap.docs[0];
    await updateDoc(doc(db, "users", targetDoc.id), {
      [role]: value,
      updatedAt: serverTimestamp()
    });

    return { 
      success: true, 
      message: `User role updated successfully.` 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
