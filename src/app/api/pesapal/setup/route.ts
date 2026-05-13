import { NextResponse } from 'next/server';
import { registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic endpoint to register the PesaPal IPN ID for the live site.
 * Visit /api/pesapal/setup in the browser to get your IPN_ID.
 * Updated to prevent white-screens by always returning JSON.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';
  
  // Check for credentials first
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!key || !secret) {
    return NextResponse.json({ 
      status: 'Vercel Config Error',
      message: 'PESAPAL_CONSUMER_KEY or PESAPAL_CONSUMER_SECRET is not set in Vercel Project Settings.',
      action_required: 'Add your Live PesaPal keys to Vercel Environment Variables.',
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
      message: error.message || 'Could not communicate with PesaPal Live API.',
      tip: 'Verify if your keys are for Sandbox or Live and set PESAPAL_SANDBOX accordingly.'
    }, { status: 500 });
  }
}
