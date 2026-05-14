
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getTransactionStatus } from '@/app/actions/pesapal';

/**
 * @fileOverview Webhook for PesaPal payment notifications.
 * It verifies the transaction status and awards coins to the user.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ status: 'invalid_params' }, { status: 400 });
  }

  try {
    const { firestore: db } = initializeFirebase();

    // 1. Verify payment status with PesaPal API
    const statusResult = await getTransactionStatus(orderTrackingId);
    
    // Status Code 1 = Completed in PesaPal v3
    if (statusResult && statusResult.status_code === 1) {
      const amountPaid = statusResult.amount;
      
      // 2. Identify user from Merchant Reference
      // Format: MF_UID_TIMESTAMP
      const parts = orderMerchantReference.split('_');
      const uid = parts[1];

      if (uid) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // 3. Award coins (1 KES = 10 Coins)
          const coinsToAward = Math.floor(amountPaid * 10);
          
          await updateDoc(userRef, {
            coins: increment(coinsToAward),
            lastPaymentAt: serverTimestamp(),
            lastOrderTrackingId: orderTrackingId
          });

          console.log(`[PesaPal IPN] Successfully awarded ${coinsToAward} coins to user ${uid}`);
        }
      }
    } else {
      console.log(`[PesaPal IPN] Transaction not completed. Status: ${statusResult?.payment_status_description || 'Unknown'}`);
    }

    // PesaPal requires a 200 response with this specific JSON format to acknowledge IPN
    return NextResponse.json({
      order_tracking_id: orderTrackingId,
      order_merchant_reference: orderMerchantReference,
      status: "OK"
    });
  } catch (err: any) {
    console.error("[PesaPal IPN] Critical Error:", err);
    // Still return OK to PesaPal to stop retries, but log the error for us
    return NextResponse.json({
      order_tracking_id: orderTrackingId,
      order_merchant_reference: orderMerchantReference,
      status: "OK" 
    });
  }
}
