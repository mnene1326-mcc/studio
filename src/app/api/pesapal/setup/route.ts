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
      throw new Error(`Auth Step Failed: ${err.message}. Ensure PESAPAL_CONSUMER_KEY and SECRET are Live production keys.`);
    });

    // Step 2: Register IPN
    const ipnId = await registerIPN(token).catch(err => {
      throw new Error(`IPN Registration Step Failed: ${err.message}. Check if your IPN endpoint is accessible via HTTPS.`);
    });

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully (Live Production).',
      ipn_id: ipnId,
      ipn_url: ipnUrl,
      next_step: 'Add the "ipn_id" above to your Vercel Environment Variables as PESAPAL_IPN_ID and redeploy.'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'PesaPal API Error',
      message: error.message,
      debug: {
        attempted_url: ipnUrl,
        tip: '1. Deploy your app first. 2. Ensure your keys are Live production keys from PesaPal.'
      }
    }, { status: 500 });
  }
}
