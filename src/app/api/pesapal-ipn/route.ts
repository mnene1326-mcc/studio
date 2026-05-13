import { NextResponse } from 'next/server';

/**
 * PesaPal Instant Payment Notification (IPN) handler.
 * Path: /api/pesapal-ipn
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const orderMerchantReference = searchParams.get('OrderMerchantReference');

  console.log('PesaPal IPN Notification Received (GET):', { orderTrackingId, orderMerchantReference });

  // PesaPal requires an OK response to confirm receipt
  return NextResponse.json({ status: 'OK' });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log('PesaPal IPN Notification Received (POST):', body);
  
  return NextResponse.json({ status: 'OK' });
}
