
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, update, increment as rtdbIncrement } from 'firebase/database';
import { getTransactionStatus } from '@/app/actions/pesapal';

/**
 * @fileOverview Webhook for PesaPal payment notifications.
 * Awards coins in RTDB for high-frequency optimization.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ status: 'invalid_params' }, { status: 400 });
  }

  try {
    const { firestore: db, database: rtdb } = initializeFirebase();

    const statusResult = await getTransactionStatus(orderTrackingId);
    
    if (statusResult && statusResult.status_code === 1) {
      const amountPaid = statusResult.amount;
      const parts = orderMerchantReference.split('_');
      const uid = parts[1];

      if (uid) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const coinsToAward = Math.floor(amountPaid * 10);
          
          // 1. Award coins in RTDB (Optimization)
          await update(ref(rtdb, `balances/${uid}`), {
            coins: rtdbIncrement(coinsToAward),
            updatedAt: Date.now()
          });

          // 2. Log payment metadata in Firestore
          await updateDoc(userRef, {
            lastPaymentAt: serverTimestamp(),
            lastOrderTrackingId: orderTrackingId
          });

          console.log(`[PesaPal IPN] Successfully awarded ${coinsToAward} coins to user ${uid} in RTDB`);
        }
      }
    }

    return NextResponse.json({
      order_tracking_id: orderTrackingId,
      order_merchant_reference: orderMerchantReference,
      status: "OK"
    });
  } catch (err: any) {
    console.error("[PesaPal IPN] Critical Error:", err);
    return NextResponse.json({
      order_tracking_id: orderTrackingId,
      order_merchant_reference: orderMerchantReference,
      status: "OK" 
    });
  }
}
