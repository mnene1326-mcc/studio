import { NextResponse } from 'next/server';
import { getAccessToken, registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic utility to register IPN and retrieve IPN_ID for Live environment.
 */
export async function GET() {
  try {
    // Step 1: Auth
    const token = await getAccessToken().catch(err => {
      throw new Error(`Auth Step Failed: ${err.message}`);
    });

    // Step 2: Register IPN
    const ipnId = await registerIPN(token).catch(err => {
      throw new Error(`IPN Registration Step Failed: ${err.message}`);
    });

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully (Live Production).',
      ipn_id: ipnId,
      ipn_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal-ipn`,
      next_step: 'Add this ipn_id to your Vercel Environment Variables as PESAPAL_IPN_ID'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'PesaPal API Error',
      message: error.message,
      tip: 'Ensure your Live Consumer Key/Secret are correct and your site is accessible via HTTPS.'
    }, { status: 500 });
  }
}
