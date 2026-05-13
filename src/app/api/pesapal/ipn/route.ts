
import { NextResponse } from 'next/server';

/**
 * PesaPal Instant Payment Notification (IPN) handler.
 * This is where PesaPal sends status updates for transactions.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');
  const orderNotificationType = searchParams.get('OrderNotificationType');

  // In a real implementation, you would:
  // 1. Authenticate with PesaPal to get a token
  // 2. Call GetTransactionStatus using the orderTrackingId
  // 3. If status is 'Completed', find the user in Firestore and add their coins.
  
  console.log('PesaPal IPN Received:', { orderTrackingId, orderMerchantReference, orderNotificationType });

  return NextResponse.json({ status: 'OK' });
}

export async function POST(req: Request) {
  // Handle POST if PesaPal is configured for POST notifications
  return NextResponse.json({ status: 'OK' });
}
