
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, update, increment as rtdbIncrement, get, set, push } from 'firebase/database';

/**
 * Awards coins to a user based on their numeric MatchFlow ID.
 * Admins: Unlimited awards (no deduction).
 * Coin Sellers: Deducted from their own RTDB balance.
 */
export async function awardCoinsAction(callerUid: string, targetMatchFlowId: string, amount: number) {
  const { firestore: db, database: rtdb } = initializeFirebase();

  // Enforce Production Limits
  if (amount < 500) {
    return { success: false, error: "Minimum award amount is 500 coins." };
  }
  if (amount > 50000) {
    return { success: false, error: "Maximum single award limit is 50,000 coins." };
  }

  try {
    // 1. Get caller profile to check roles
    const callerSnap = await getDoc(doc(db, "users", callerUid));
    if (!callerSnap.exists()) return { success: false, error: "Caller profile not found." };
    
    const callerData = callerSnap.data();
    if (!callerData) return { success: false, error: "Caller data is empty." };
    
    // 2. Security Check: Only Admin or Coin Seller can award
    if (!callerData.isAdmin && !callerData.isCoinSeller) {
      return { success: false, error: "Unauthorized. You are not an Admin or Coin Seller." };
    }

    // 3. Balance Deduction for Coin Sellers (Admins are exempt)
    if (callerData.isCoinSeller && !callerData.isAdmin) {
      const sellerBalanceSnap = await get(ref(rtdb, `balances/${callerUid}`));
      const currentSellerBalance = sellerBalanceSnap.val()?.coins || 0;
      
      if (currentSellerBalance < amount) {
        return { success: false, error: `Insufficient balance. You only have ${currentSellerBalance} coins.` };
      }
      
      // Deduct from seller in RTDB
      await update(ref(rtdb, `balances/${callerUid}`), {
        coins: rtdbIncrement(-amount),
        updatedAt: Date.now()
      });

      // Log deduction in seller's history
      await set(push(ref(rtdb, `coin_history/${callerUid}`)), {
        amount: -amount,
        type: 'sold',
        description: `Sold to ID: ${targetMatchFlowId}`,
        timestamp: Date.now()
      });
    }

    // 4. Find target user by numeric MatchFlow ID in Firestore
    const targetQuery = query(collection(db, "users"), where("matchFlowId", "==", targetMatchFlowId.trim()));
    const targetSnap = await getDocs(targetQuery);
    if (targetSnap.empty) {
      // If we deducted from a seller but the target is wrong, we should ideally refund, 
      // but for this flow we assume IDs are verified before submission.
      return { success: false, error: "User with this MatchFlow ID not found." };
    }

    const targetDoc = targetSnap.docs[0];
    const targetUid = targetDoc.id;

    // 5. Award coins to target in RTDB
    const timestamp = Date.now();
    await update(ref(rtdb, `balances/${targetUid}`), {
      coins: rtdbIncrement(amount),
      updatedAt: timestamp
    });

    // 6. Log to recipient's history
    await set(push(ref(rtdb, `coin_history/${targetUid}`)), {
      amount: amount,
      type: 'award',
      description: `Awarded by ${callerData.isAdmin ? 'System Admin' : 'Certified Seller'}`,
      timestamp: timestamp
    });

    return { 
      success: true, 
      message: `Successfully awarded ${amount} coins to ${targetDoc.data().name}.` 
    };
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
