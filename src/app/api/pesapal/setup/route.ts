
import { NextResponse } from 'next/server';
import { registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic endpoint to register the PesaPal IPN ID for the live site.
 * Visit /api/pesapal/setup in the browser to get your IPN_ID.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';
  
  // Check for credentials first to provide clear error feedback
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!key || !secret) {
    return NextResponse.json({ 
      status: 'Configuration Error',
      message: 'PesaPal Consumer Key or Secret is missing from environment variables.',
      action_required: 'Please add PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET to your Vercel Project Settings.',
      current_env: {
        PESAPAL_SANDBOX: process.env.PESAPAL_SANDBOX || 'false (default)',
        NEXT_PUBLIC_APP_URL: appUrl
      }
    }, { status: 400 });
  }
  
  try {
    const result = await registerIPN(appUrl);
    return NextResponse.json({ 
      status: 'Success',
      message: 'PesaPal IPN Registration Completed', 
      ipn_id: result.ipn_id,
      registered_url: result.url,
      next_step: 'Add this IPN_ID to your environment variables as PESAPAL_IPN_ID on Vercel.'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'PesaPal API Error',
      message: error.message || 'Failed to communicate with PesaPal servers.',
      details: 'Check if your PesaPal keys are for Sandbox or Live and ensure PESAPAL_SANDBOX is set correctly.'
    }, { status: 500 });
  }
}
