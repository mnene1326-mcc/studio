
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, addDoc, count } from 'firebase/firestore';
import { ref, update, increment as rtdbIncrement, get, push } from 'firebase/database';

export async function createAgencyAction(agentUid: string, agencyName: string) {
  const { firestore: db } = initializeFirebase();
  try {
    const agentRef = doc(db, "users", agentUid);
    const agentSnap = await getDoc(agentRef);
    if (!agentSnap.exists() || !agentSnap.data().isAgent) return { success: false, error: "Only Agents can create agencies." };
    let code = "";
    let isUnique = false;
    while (!isUnique) {
      code = Math.floor(10000 + Math.random() * 90000).toString();
      const check = await getDoc(doc(db, "agencies", code));
      if (!check.exists()) isUnique = true;
    }
    await setDoc(doc(db, "agencies", code), { code, agentUid, name: agencyName || "MatchFlow Agency", createdAt: serverTimestamp() });
    await updateDoc(agentRef, { agencyId: code, agencyStatus: 'approved', updatedAt: serverTimestamp() });
    return { success: true, code };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function requestWithdrawalAction(uid: string, diamonds: number, amountKes: number, agencyId: string) {
  const { firestore: db, database: rtdb } = initializeFirebase();
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const balSnap = await get(ref(rtdb, `balances/${uid}`));
    const currentDiamonds = balSnap.val()?.diamonds || 0;
    if (!userSnap.exists() || currentDiamonds < diamonds) return { success: false, error: "Insufficient diamonds." };
    await update(ref(rtdb, `balances/${uid}`), { diamonds: rtdbIncrement(-diamonds), updatedAt: Date.now() });
    await addDoc(collection(db, "agencies", agencyId, "withdrawals"), { uid, userName: userSnap.data().name || "Unknown", agencyId, diamonds, amountKes, status: 'pending', createdAt: serverTimestamp() });
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateWithdrawalStatusAction(agentUid: string, agencyId: string, withdrawalId: string, status: 'paid' | 'rejected') {
  const { firestore: db, database: rtdb } = initializeFirebase();
  try {
    const withdrawalRef = doc(db, "agencies", agencyId, "withdrawals", withdrawalId);
    const withdrawalSnap = await getDoc(withdrawalRef);
    if (!withdrawalSnap.exists()) return { success: false, error: "Request not found." };
    const data = withdrawalSnap.data();
    if (status === 'rejected') {
      await update(ref(rtdb, `balances/${data.uid}`), { diamonds: rtdbIncrement(data.diamonds), updatedAt: Date.now() });
    } else if (status === 'paid') {
      const timestamp = Date.now();
      await push(ref(rtdb, `notifications/${data.uid}`), { text: `Your withdrawal of Ksh ${data.amountKes} has been paid out!`, type: 'payout', timestamp });
    }
    await updateDoc(withdrawalRef, { status, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function joinAgencyAction(userUid: string, agencyCode: string) {
  const { firestore: db } = initializeFirebase();
  try {
    const userRef = doc(db, "users", userUid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || userSnap.data().gender !== 'female') return { success: false, error: "Only female users can join agencies." };
    const agencySnap = await getDoc(doc(db, "agencies", agencyCode.trim()));
    if (!agencySnap.exists()) return { success: false, error: "Invalid Agency Code." };
    await updateDoc(userRef, { agencyId: agencyCode.trim(), agencyStatus: 'pending', updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function reviewRecruitmentAction(agentUid: string, targetUid: string, status: 'approved' | 'rejected') {
  const { firestore: db } = initializeFirebase();
  try {
    if (status === 'approved') {
      const agentSnap = await getDoc(doc(db, "users", agentUid));
      const agencyId = agentSnap.data()?.agencyId;
      if (!agencyId) return { success: false, error: "Agency not found." };
      const membersSnap = await getDocs(query(collection(db, "users"), where("agencyId", "==", agencyId), where("agencyStatus", "==", "approved")));
      if (membersSnap.size >= 59) return { success: false, error: "Agency limit reached (max 60 members including agent)." };
    }
    await updateDoc(doc(db, "users", targetUid), { agencyStatus: status, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}
