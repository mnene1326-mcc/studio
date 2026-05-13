import { NextResponse } from 'next/server';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTransactionStatus } from '@/app/actions/pesapal';

/**
 * PesaPal Instant Payment Notification (IPN) handler.
 * This endpoint verifies the payment with PesaPal before crediting the user.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ status: 'Invalid parameters' }, { status: 400 });
  }

  // 1. Verify transaction status with PesaPal (Live)
  const statusData = await getTransactionStatus(orderTrackingId);
  
  if (statusData && statusData.payment_status_description === 'Completed') {
    // 2. Identify the user and amount from the merchant reference
    // Reference format: RECHARGE_userId_amount_timestamp
    if (orderMerchantReference.startsWith('RECHARGE_')) {
      const parts = orderMerchantReference.split('_');
      const userId = parts[1];
      const amountPaid = parseFloat(parts[2]);

      // Coins calculation (1 KES = 10 Coins based on your packages)
      const coinsToCredit = amountPaid * 10;

      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          coins: increment(coinsToCredit)
        });
        console.log(`Successfully credited ${coinsToCredit} coins to user ${userId}`);
      } catch (e) {
        console.error('IPN Firestore Update Failed:', e);
        return NextResponse.json({ status: 'Database Error' }, { status: 500 });
      }
    }
  }

  // PesaPal expects a 200 OK response with this exact structure if successful
  return NextResponse.json({ status: 'OK' });
}
