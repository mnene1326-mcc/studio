
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { ref, update, increment as rtdbIncrement, get } from 'firebase/database';

/**
 * Creates a new agency for an agent.
 */
export async function createAgencyAction(agentUid: string, agencyName: string) {
  const { firestore: db } = initializeFirebase();

  try {
    const agentRef = doc(db, "users", agentUid);
    const agentSnap = await getDoc(agentRef);
    if (!agentSnap.exists() || !agentSnap.data().isAgent) {
      return { success: false, error: "Only Agents can create agencies." };
    }

    let code = "";
    let isUnique = false;
    while (!isUnique) {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      const check = await getDoc(doc(db, "agencies", code));
      if (!check.exists()) isUnique = true;
    }

    await setDoc(doc(db, "agencies", code), {
      code,
      agentUid,
      name: agencyName || "MatchFlow Agency",
      createdAt: serverTimestamp()
    });

    await updateDoc(agentRef, {
      agencyId: code,
      agencyStatus: 'approved',
      updatedAt: serverTimestamp()
    });

    return { success: true, code };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Request a diamond-to-cash withdrawal.
 * Deducts diamonds from RTDB balance.
 */
export async function requestWithdrawalAction(uid: string, diamonds: number, amountKes: number, agencyId: string) {
  const { firestore: db, database: rtdb } = initializeFirebase();

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    // Check balance in RTDB
    const balSnap = await get(ref(rtdb, `balances/${uid}`));
    const currentDiamonds = balSnap.val()?.diamonds || 0;

    if (!userSnap.exists() || currentDiamonds < diamonds) {
      return { success: false, error: "Insufficient diamonds." };
    }

    // 1. Deduct diamonds in RTDB (Optimization)
    await update(ref(rtdb, `balances/${uid}`), {
      diamonds: rtdbIncrement(-diamonds),
      updatedAt: Date.now()
    });

    // 2. Create withdrawal request in Firestore (The Vault)
    await addDoc(collection(db, "agencies", agencyId, "withdrawals"), {
      uid,
      userName: userSnap.data().name || "Unknown",
      agencyId,
      diamonds,
      amountKes,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update withdrawal status (Agent action)
 * If rejected, refunds diamonds to RTDB.
 */
export async function updateWithdrawalStatusAction(agentUid: string, agencyId: string, withdrawalId: string, status: 'paid' | 'rejected') {
  const { firestore: db, database: rtdb } = initializeFirebase();

  try {
    const agentSnap = await getDoc(doc(db, "users", agentUid));
    if (!agentSnap.exists() || !agentSnap.data().isAgent || agentSnap.data().agencyId !== agencyId) {
      return { success: false, error: "Unauthorized." };
    }

    const withdrawalRef = doc(db, "agencies", agencyId, "withdrawals", withdrawalId);
    const withdrawalSnap = await getDoc(withdrawalRef);
    if (!withdrawalSnap.exists()) return { success: false, error: "Request not found." };

    const data = withdrawalSnap.data();

    if (status === 'rejected') {
      // Refund diamonds in RTDB if rejected
      await update(ref(rtdb, `balances/${data.uid}`), {
        diamonds: rtdbIncrement(data.diamonds),
        updatedAt: Date.now()
      });
    }

    await updateDoc(withdrawalRef, {
      status,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Allows a female user to join an agency.
 */
export async function joinAgencyAction(userUid: string, agencyCode: string) {
  const { firestore: db } = initializeFirebase();
  try {
    const userRef = doc(db, "users", userUid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || userSnap.data().gender !== 'female') {
      return { success: false, error: "Only female users can join agencies." };
    }
    const agencySnap = await getDoc(doc(db, "agencies", agencyCode.trim()));
    if (!agencySnap.exists()) return { success: false, error: "Invalid Agency Code." };
    await updateDoc(userRef, {
      agencyId: agencyCode.trim(),
      agencyStatus: 'pending',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Agent approves or rejects a recruitment request.
 */
export async function reviewRecruitmentAction(agentUid: string, targetUid: string, status: 'approved' | 'rejected') {
  const { firestore: db } = initializeFirebase();
  try {
    await updateDoc(doc(db, "users", targetUid), {
      agencyStatus: status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
