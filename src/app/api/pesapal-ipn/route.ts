import { NextResponse } from 'next/server';
import { doc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * PesaPal Instant Payment Notification (IPN) handler.
 * Expected at: https://matchflow-iota.vercel.app/api/pesapal-ipn
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  // Logic: 
  // 1. MerchantRef usually looks like RECHARGE_userId_timestamp
  // 2. Extract userId
  // 3. Update their coins in Firestore
  
  if (orderMerchantReference?.startsWith('RECHARGE_')) {
    const parts = orderMerchantReference.split('_');
    const userId = parts[1];
    
    // In a production app, we would re-verify the transaction status with PesaPal here.
    // For this prototype, we assume GET notification implies success or intent.
    
    try {
      const userRef = doc(db, 'users', userId);
      // Determine coin amount from ref or just add a default (e.g., matching the package)
      // For simplicity, we'll need to store the intended amount in a 'pending_transactions' collection
      // but here we demonstrate the balance update.
      await updateDoc(userRef, {
        coins: increment(1000) // Example update
      });
    } catch (e) {
      console.error('IPN Firestore Update Failed:', e);
    }
  }

  return NextResponse.json({ status: 'OK' });
}
