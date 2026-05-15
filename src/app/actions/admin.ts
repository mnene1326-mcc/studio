
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, update, increment as rtdbIncrement, get } from 'firebase/database';

/**
 * Awards coins to a user based on their numeric MatchFlow ID.
 * Balances are managed in RTDB for high-frequency optimization.
 */
export async function awardCoinsAction(callerUid: string, targetMatchFlowId: string, amount: number) {
  const { firestore: db, database: rtdb } = initializeFirebase();

  try {
    const callerSnap = await getDoc(doc(db, "users", callerUid));
    if (!callerSnap.exists()) return { success: false, error: "Caller profile not found." };
    
    const callerData = callerSnap.docs ? callerSnap.docs[0].data() : callerSnap.data();
    
    if (!callerData.isAdmin && !callerData.isCoinSeller) {
      return { success: false, error: "Unauthorized." };
    }

    if (callerData.isCoinSeller && !callerData.isAdmin) {
      // Check RTDB balance
      const balanceSnap = await get(ref(rtdb, `balances/${callerUid}`));
      const currentBalance = balanceSnap.val()?.coins || 0;
      
      if (currentBalance < amount) {
        return { success: false, error: `Insufficient balance. You have ${currentBalance} coins.` };
      }
      
      // Deduct from seller in RTDB
      await update(ref(rtdb, `balances/${callerUid}`), {
        coins: rtdbIncrement(-amount),
        updatedAt: Date.now()
      });
    }

    // Find target in Firestore
    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);
    if (targetSnap.empty) return { success: false, error: "User with this ID not found." };

    const targetDoc = targetSnap.docs[0];
    const targetUid = targetDoc.data().uid;

    // Award to target in RTDB
    await update(ref(rtdb, `balances/${targetUid}`), {
      coins: rtdbIncrement(amount),
      updatedAt: Date.now()
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
    const callerSnap = await getDoc(doc(db, "users", callerUid));
    if (!callerSnap.exists() || !callerSnap.data().isAdmin) {
      return { success: false, error: "Unauthorized. Only Admins can manage roles." };
    }

    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);
    if (targetSnap.empty) return { success: false, error: "User not found." };

    const targetDoc = targetSnap.docs[0];
    const { updateDoc, serverTimestamp } = await import('firebase/firestore');
    await updateDoc(doc(db, "users", targetDoc.id), {
      [role]: value,
      updatedAt: serverTimestamp()
    });

    return { success: true, message: `User role updated successfully.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
