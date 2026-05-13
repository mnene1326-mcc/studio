import { NextResponse } from 'next/server';
import { registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic endpoint to register the PesaPal IPN ID for the live site.
 * Visit /api/pesapal/setup in the browser to get your IPN_ID.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';
  
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!key || !secret) {
    return NextResponse.json({ 
      status: 'Config Missing',
      message: 'PESAPAL_CONSUMER_KEY or SECRET is not set in Vercel.',
      debug: {
        PESAPAL_SANDBOX: process.env.PESAPAL_SANDBOX || 'false (default)',
        NEXT_PUBLIC_APP_URL: appUrl
      }
    }, { status: 400 });
  }
  
  try {
    const result = await registerIPN(appUrl);
    return NextResponse.json({ 
      status: 'Success',
      message: 'PesaPal Live IPN Registered Successfully', 
      ipn_id: result.ipn_id,
      registered_url: result.url,
      next_step: 'Copy this IPN_ID and add it to Vercel Environment Variables as PESAPAL_IPN_ID.'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'PesaPal API Error',
      message: error.message,
      tip: 'This error usually means your Keys are incorrect or blocked by PesaPal. Check if you are using Live Keys with PESAPAL_SANDBOX=false.'
    }, { status: 500 });
  }
}
