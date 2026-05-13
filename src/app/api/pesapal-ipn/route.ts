
import { NextResponse } from 'next/server';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTransactionStatus } from '@/app/actions/pesapal';

/**
 * Unified PesaPal IPN handler.
 * Handles payment status updates and credits user coins.
 */
async function processIPN(req: Request) {
  const url = new URL(req.url);
  const orderTrackingId = url.searchParams.get('OrderTrackingId');
  const orderMerchantReference = url.searchParams.get('OrderMerchantReference');

  // Dashboard validation check: dashboard often pings with no params
  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ 
      status: 'OK', 
      message: 'MatchFlow IPN listener is active and verified.' 
    }, { status: 200 });
  }

  try {
    const statusData = await getTransactionStatus(orderTrackingId);
    
    // Status 1 = Completed in PesaPal v3
    if (statusData && (statusData.payment_status_description === 'Completed' || statusData.status_code === 1)) {
      if (orderMerchantReference.startsWith('RECHARGE_')) {
        const parts = orderMerchantReference.split('_');
        const userId = parts[1];
        const amountPaid = parseFloat(parts[2]);

        // Credit coins (e.g., 10 coins per KES 1)
        const coinsToCredit = amountPaid * 10;
        const userRef = doc(db, 'users', userId);
        
        await updateDoc(userRef, {
          coins: increment(coinsToCredit)
        });
        
        console.log(`Successfully credited ${coinsToCredit} coins to user ${userId}`);
      }
    }
    
    return NextResponse.json({ 
      status: 'OK', 
      orderTrackingId, 
      merchantReference: orderMerchantReference 
    }, { status: 200 });
  } catch (e: any) {
    console.error('IPN Processing Error:', e.message);
    // Return 200 even on error to stop PesaPal retries if it's a code issue
    return NextResponse.json({ status: 'Processing Error', message: e.message }, { status: 200 });
  }
}

export async function GET(req: Request) {
  return processIPN(req);
}

export async function POST(req: Request) {
  return processIPN(req);
}
