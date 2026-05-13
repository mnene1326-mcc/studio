
import { NextResponse } from 'next/server';
import { getAccessToken, registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic utility to register IPN and retrieve IPN_ID for Live environment.
 */
export async function GET() {
  const appUrl = 'https://matchflow-iota.vercel.app';
  const ipnUrl = `${appUrl}/api/pesapal-ipn`;

  try {
    // Step 1: Auth
    const token = await getAccessToken().catch(err => {
      throw new Error(`Step 1 (Auth) Failed: ${err.message}`);
    });

    // Step 2: Register IPN
    const ipnId = await registerIPN(token).catch(err => {
      throw new Error(`Step 2 (IPN Registration) Failed: ${err.message}`);
    });

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully (Live Production).',
      ipn_id: ipnId,
      ipn_url: ipnUrl,
      next_step: 'Add the "ipn_id" above to your Environment Variables as PESAPAL_IPN_ID and redeploy.'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Setup Error',
      error: error.message,
      debug: {
        ipn_endpoint: ipnUrl,
        tip: 'Check your Consumer Key and Secret are the LIVE ones from PesaPal.'
      }
    }, { status: 500 });
  }
}
