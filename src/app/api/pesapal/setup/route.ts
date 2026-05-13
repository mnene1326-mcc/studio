
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
        tip: "Check your Consumer Key and Secret in Vercel. Ensure they are Live keys."
      });
    }

    // Try to get existing IPNs first (Option B from user)
    const ipnList = await getIPNList(authResult.token);
    
    // Attempt new registration (Option A from user)
    const regResult = await registerIPN(authResult.token);
    
    return NextResponse.json({
      status: 'Check Results Below',
      automated_registration_attempt: regResult,
      currently_registered_ipns: ipnList,
      instructions: [
        "1. Look at 'currently_registered_ipns' list above.",
        "2. Find the entry for 'matchflow-iota.vercel.app'.",
        "3. Copy the 'ipn_id' string next to it.",
        "4. Go to Vercel -> Settings -> Environment Variables.",
        "5. Add PESAPAL_IPN_ID and redeploy.",
        "--------------------------------------------------",
        "IF NO IPN_ID IS FOUND ABOVE:",
        "1. Go to PesaPal Dashboard -> IPN Settings.",
        "2. Add a new entry for 'matchflow-iota.vercel.app'.",
        "3. Once saved, copy the 'ID' from the dashboard table.",
        "4. Use that as your PESAPAL_IPN_ID."
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Setup Error',
      message: error.message
    });
  }
}
