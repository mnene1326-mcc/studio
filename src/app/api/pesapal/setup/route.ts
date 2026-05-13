import { NextResponse } from 'next/server';
import { getAccessToken, registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic utility to register IPN and retrieve IPN_ID.
 * Visit matchflow-iota.vercel.app/api/pesapal/setup to run.
 */
export async function GET() {
  try {
    const token = await getAccessToken();
    const ipnId = await registerIPN(token);

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully.',
      ipn_id: ipnId,
      environment: process.env.PESAPAL_SANDBOX === 'true' ? 'Sandbox' : 'Live',
      next_step: 'Add this ipn_id to your Vercel Environment Variables as PESAPAL_IPN_ID'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'PesaPal Setup Error',
      message: error.message,
      environment: process.env.PESAPAL_SANDBOX === 'true' ? 'Sandbox' : 'Live',
      tip: 'Ensure your Consumer Key/Secret are correct for the targeted environment.'
    }, { status: 500 });
  }
}
