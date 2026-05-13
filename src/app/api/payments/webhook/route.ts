import { NextResponse } from 'next/server';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Webhook listener for InstaSend payment notifications.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('InstaSend Webhook Received:', JSON.stringify(body, null, 2));

    // InstaSend typical successful payload has "state": "COMPLETED"
    // Sometimes metadata is a string that needs parsing
    const isSuccessful = body.state === 'COMPLETED' || body.status === 'COMPLETED';
    
    let metadata = body.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.warn('Failed to parse metadata string', metadata);
      }
    }

    if (isSuccessful && metadata?.uid && metadata?.packageAmount) {
      const { firestore } = initializeFirebase();
      const userRef = doc(firestore, 'users', metadata.uid);
      const coinsToAdd = parseInt(metadata.packageAmount);

      console.log(`Fulfilling ${coinsToAdd} coins for user ${metadata.uid}`);

      await updateDoc(userRef, {
        coins: increment(coinsToAdd),
        updatedAt: serverTimestamp(),
        lastPaymentAt: serverTimestamp(),
        lastPaymentAmount: body.amount,
        lastPaymentId: body.id || body.txn_id
      });

      return NextResponse.json({ status: 'success', message: 'Credits fulfilled' });
    }

    console.log('Webhook ignored: Payment not completed or invalid metadata');
    return NextResponse.json({ status: 'ignored', message: 'Payment not completed or missing metadata' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', message: 'MatchFlow Payment Webhook is online' });
}
