
import { NextResponse } from 'next/server';
import { getAccessToken, registerIPN, getIPNList } from '@/app/actions/pesapal';

/**
 * Diagnostic utility to register IPN and retrieve IPN_ID.
 */
export async function GET() {
  const appUrl = 'https://matchflow-iota.vercel.app';
  const ipnUrl = `${appUrl}/api/pesapal-ipn`;

  try {
    const authResult = await getAccessToken();
    if ('error' in authResult) {
      return NextResponse.json({
        status: 'Authentication Failed',
        message: authResult.error,
        tip: "Check your Consumer Key and Secret in Vercel."
      });
    }

    // Try to get existing IPNs first
    const ipnList = await getIPNList(authResult.token);
    
    // Attempt registration
    const regResult = await registerIPN(authResult.token);
    
    return NextResponse.json({
      status: 'Check Results Below',
      automated_registration_attempt: regResult,
      currently_registered_ipns: ipnList,
      steps: [
        "1. If 'ipn_id' is visible in either result above, COPY IT.",
        "2. If not, go to PesaPal Dashboard -> IPN Settings.",
        "3. Find the entry for 'matchflow-iota.vercel.app' in the table.",
        "4. Copy the ID from the 'IPN ID' or 'ID' column.",
        "5. Add it to Vercel as PESAPAL_IPN_ID and redeploy."
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Setup Error',
      message: error.message
    });
  }
}
