import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

/**
 * @fileOverview Webhook for IntaSend payment notifications.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // IntaSend webhook data contains 'state' and 'challenge' (if applicable)
    // and 'invoice' details.
    if (data.state === 'COMPLETE') {
      const externalId = data.invoice.external_id; // e.g., MF-123456789-abcde
      const amount = data.invoice.amount;

      // Map external ID back to user
      // External ID format: MF-TIMESTAMP-UID_PREFIX
      // Note: In production, you should ideally save the full external_id 
      // in a 'pending_payments' collection to look up the exact UID.
      
      // For this prototype, we'll log it.
      console.log(`Payment confirmed: ${amount} KES for order ${externalId}`);
    }

    return NextResponse.json({ status: 'received' });
  } catch (err) {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }
}
