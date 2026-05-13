
import { NextResponse } from 'next/server';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTransactionStatus } from '@/app/actions/pesapal';

/**
 * Unified PesaPal IPN handler for GET and POST.
 * Handles payment status updates and credits user coins.
 */
async function processIPN(req: Request) {
  const url = new URL(req.url);
  const orderTrackingId = url.searchParams.get('OrderTrackingId');
  const orderMerchantReference = url.searchParams.get('OrderMerchantReference');

  // If parameters are missing, it's likely a validation ping from PesaPal or a manual visit.
  // We return 200 OK with a friendly message to satisfy dashboard validation.
  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ 
      status: 'OK', 
      message: 'MatchFlow IPN endpoint is active and waiting for data.' 
    }, { status: 200 });
  }

  try {
    // 1. Verify transaction status with PesaPal Live
    const statusData = await getTransactionStatus(orderTrackingId);
    
    // Status 1 = Completed in PesaPal v3
    if (statusData && (statusData.payment_status_description === 'Completed' || statusData.status_code === 1)) {
      // Reference format: RECHARGE_userId_amount_timestamp
      if (orderMerchantReference.startsWith('RECHARGE_')) {
        const parts = orderMerchantReference.split('_');
        const userId = parts[1];
        const amountPaid = parseFloat(parts[2]);

        // Coins calculation: 1 KES = 10 Coins
        const coinsToCredit = amountPaid * 10;

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          coins: increment(coinsToCredit)
        });
        
        console.log(`Successfully credited ${coinsToCredit} coins to user ${userId}`);
      }
    }
    
    // PesaPal expects a 200 OK with this JSON structure to stop retrying the notification
    return NextResponse.json({ 
      status: 'OK', 
      orderTrackingId, 
      merchantReference: orderMerchantReference 
    });
  } catch (e: any) {
    console.error('IPN Processing Error:', e.message);
    // Still return 200 so PesaPal doesn't keep retrying if it's a logical error
    return NextResponse.json({ status: 'Processing Error', message: e.message }, { status: 200 });
  }
}

export async function GET(req: Request) {
  return processIPN(req);
}

export async function POST(req: Request) {
  return processIPN(req);
}
