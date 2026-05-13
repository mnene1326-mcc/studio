
import { NextResponse } from 'next/server';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Webhook listener for InstaSend payment notifications.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('InstaSend Webhook Received:', body);

    // InstaSend typical successful payload has "state": "COMPLETED" or similar
    // Check their documentation for the exact key (usually 'status' or 'state')
    const isSuccessful = body.state === 'COMPLETED' || body.status === 'COMPLETED';
    const metadata = body.metadata;

    if (isSuccessful && metadata?.uid && metadata?.packageAmount) {
      const { firestore } = initializeFirebase();
      const userRef = doc(firestore, 'users', metadata.uid);
      const coinsToAdd = parseInt(metadata.packageAmount);

      await updateDoc(userRef, {
        coins: increment(coinsToAdd),
        updatedAt: serverTimestamp(),
        lastPaymentAt: serverTimestamp(),
        lastPaymentAmount: body.amount
      });

      return NextResponse.json({ status: 'success', message: 'Credits fulfilled' });
    }

    return NextResponse.json({ status: 'ignored', message: 'Payment not completed or missing metadata' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', message: 'MatchFlow Payment Webhook is online' });
}
