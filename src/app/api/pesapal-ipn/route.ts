import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Webhook for PesaPal payment notifications.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ status: 'invalid_params' }, { status: 400 });
  }

  // PesaPal requires a 200 response with this specific JSON format to acknowledge IPN
  return NextResponse.json({
    order_tracking_id: orderTrackingId,
    order_merchant_reference: orderMerchantReference,
    status: "OK"
  });
}

// Note: In a real production app, you would use Transaction/GetTransactionStatus 
// here to verify the payment before adding coins.
