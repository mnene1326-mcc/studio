import { NextResponse } from 'next/server';
import { registerIPN, getAccessToken } from '@/app/actions/pesapal';

/**
 * Diagnostic endpoint to register the PesaPal IPN ID for the live site.
 * Path: /api/pesapal/setup
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';
  
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!key || !secret) {
    return NextResponse.json({ 
      status: 'Configuration Error',
      message: 'PESAPAL_CONSUMER_KEY or SECRET is not set in Vercel.',
      debug: { NEXT_PUBLIC_APP_URL: appUrl }
    }, { status: 400 });
  }
  
  try {
    // Step 1: Verify Auth
    const token = await getAccessToken().catch((e) => { throw new Error(`Auth Step Failed: ${e.message}`) });

    // Step 2: Register IPN at /api/pesapal-ipn
    const result = await registerIPN(appUrl).catch((e) => { throw new Error(`IPN Registration Step Failed: ${e.message}`) });
    
    return NextResponse.json({ 
      status: 'Success',
      message: 'Live PesaPal IPN Registered Successfully', 
      ipn_id: result.ipn_id,
      registered_url: result.url,
      token_verified: !!token,
      next_step: 'Add this ipn_id to your Vercel Environment Variables as PESAPAL_IPN_ID.'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'PesaPal API Error',
      message: error.message,
      tip: 'Verify if your keys are for Sandbox or Live and ensure pay.pesapal.com/v3 is reachable.'
    }, { status: 500 });
  }
}
