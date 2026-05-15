
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, addDoc, increment } from 'firebase/firestore';

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

    // Generate unique 5-digit code
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
      agencyStatus: 'approved', // Agents are their own members
      updatedAt: serverTimestamp()
    });

    return { success: true, code };
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
    if (!agencySnap.exists()) {
      return { success: false, error: "Invalid Agency Code. Please check and try again." };
    }

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
    const agentSnap = await getDoc(doc(db, "users", agentUid));
    if (!agentSnap.exists() || !agentSnap.data().isAgent) {
      return { success: false, error: "Unauthorized." };
    }

    await updateDoc(doc(db, "users", targetUid), {
      agencyStatus: status,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Request a diamond-to-cash withdrawal.
 */
export async function requestWithdrawalAction(uid: string, diamonds: number, amountKes: number, agencyId: string) {
  const { firestore: db } = initializeFirebase();

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists() || (userSnap.data().diamonds || 0) < diamonds) {
      return { success: false, error: "Insufficient diamonds." };
    }

    // Deduct diamonds immediately
    await updateDoc(userRef, {
      diamonds: increment(-diamonds),
      updatedAt: serverTimestamp()
    });

    // Create withdrawal request
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
 */
export async function updateWithdrawalStatusAction(agentUid: string, agencyId: string, withdrawalId: string, status: 'paid' | 'rejected') {
  const { firestore: db } = initializeFirebase();

  try {
    const agentSnap = await getDoc(doc(db, "users", agentUid));
    if (!agentSnap.exists() || !agentSnap.data().isAgent || agentSnap.data().agencyId !== agencyId) {
      return { success: false, error: "Unauthorized." };
    }

    const withdrawalRef = doc(db, "agencies", agencyId, "withdrawals", withdrawalId);
    const withdrawalSnap = await getDoc(withdrawalRef);
    if (!withdrawalSnap.exists()) return { success: false, error: "Request not found." };

    if (status === 'rejected') {
      // Refund diamonds if rejected
      await updateDoc(doc(db, "users", withdrawalSnap.data().uid), {
        diamonds: increment(withdrawalSnap.data().diamonds),
        updatedAt: serverTimestamp()
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
