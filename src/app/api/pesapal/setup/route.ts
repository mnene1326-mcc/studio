
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
      throw new Error(`Auth Failed: ${err.message}. Ensure your Live Keys are in Vercel Environment Variables.`);
    });

    // Step 2: Register IPN via API
    // Note: Automated registration often fails if PesaPal requires manual dashboard registration.
    const ipnId = await registerIPN(token).catch(err => {
      throw new Error(`Automated Registration Unavailable: ${err.message}`);
    });

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully via API.',
      ipn_id: ipnId,
      ipn_url: ipnUrl,
      next_step: 'Copy the IPN ID above and add it to Vercel as PESAPAL_IPN_ID, then redeploy.'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Action Required',
      reason: error.message,
      manual_steps: [
        "1. Go to PesaPal Dashboard -> IPN Settings.",
        `2. Website Domain: matchflow-iota.vercel.app`,
        `3. IPN Listener URL: ${ipnUrl}`,
        "4. Click SAVE.",
        "5. Copy the 'IPN ID' generated in the table on that page.",
        "6. Add it to Vercel as PESAPAL_IPN_ID and redeploy."
      ]
    }, { status: 200 });
  }
}
