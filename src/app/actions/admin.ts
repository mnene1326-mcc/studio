
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, update, increment as rtdbIncrement, get } from 'firebase/database';

/**
 * Awards coins to a user based on their numeric MatchFlow ID.
 * Balances are managed in RTDB for high-frequency optimization.
 */
export async function awardCoinsAction(callerUid: string, targetMatchFlowId: string, amount: number) {
  const { firestore: db, database: rtdb } = initializeFirebase();

  try {
    // 1. Get caller profile
    const callerSnap = await getDoc(doc(db, "users", callerUid));
    if (!callerSnap.exists()) return { success: false, error: "Caller profile not found." };
    
    const callerData = callerSnap.data();
    if (!callerData) return { success: false, error: "Caller data is empty." };
    
    // 2. Security Check: Only Admin or Coin Seller can award
    if (!callerData.isAdmin && !callerData.isCoinSeller) {
      return { success: false, error: "Unauthorized. You are not an Admin or Coin Seller." };
    }

    // 3. If Coin Seller, check their own balance first
    if (callerData.isCoinSeller && !callerData.isAdmin) {
      const balanceSnap = await get(ref(rtdb, `balances/${callerUid}`));
      const currentBalance = balanceSnap.val()?.coins || 0;
      
      if (currentBalance < amount) {
        return { success: false, error: `Insufficient balance. You only have ${currentBalance} coins.` };
      }
      
      // Deduct from seller
      await update(ref(rtdb, `balances/${callerUid}`), {
        coins: rtdbIncrement(-amount),
        updatedAt: Date.now()
      });
    }

    // 4. Find target user by numeric MatchFlow ID
    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);
    if (targetSnap.empty) return { success: false, error: "User with this MatchFlow ID not found." };

    const targetDoc = targetSnap.docs[0];
    const targetUid = targetDoc.id;

    // 5. Award coins to target in RTDB
    await update(ref(rtdb, `balances/${targetUid}`), {
      coins: rtdbIncrement(amount),
      updatedAt: Date.now()
    });

    return { success: true, message: `Successfully awarded ${amount} coins to ${targetDoc.data().name}.` };
  } catch (error: any) {
    console.error("Award Coins Action Error:", error);
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
    if (!callerSnap.exists() || !callerSnap.data()?.isAdmin) {
      return { success: false, error: "Unauthorized. Only system Admins can manage roles." };
    }

    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);
    if (targetSnap.empty) return { success: false, error: "User not found." };

    const targetDoc = targetSnap.docs[0];
    await updateDoc(doc(db, "users", targetDoc.id), {
      [role]: value,
      updatedAt: serverTimestamp()
    });

    return { success: true, message: `User role [${role}] updated to ${value}.` };
  } catch (error: any) {
    console.error("Toggle Role Action Error:", error);
    return { success: false, error: error.message };
  }
}
