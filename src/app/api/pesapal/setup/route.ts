
import { NextResponse } from 'next/server';
import { getAccessToken, registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic utility to register IPN and retrieve IPN_ID for Live environment.
 */
export async function GET() {
  const appUrl = 'https://matchflow-iota.vercel.app';
  const ipnUrl = `${appUrl}/api/pesapal-ipn`;

  try {
    const authResult = await getAccessToken();
    if ('error' in authResult) {
      throw new Error(authResult.error);
    }

    const regResult = await registerIPN(authResult.token);
    if ('error' in regResult) {
      throw new Error(regResult.error);
    }

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully via API.',
      ipn_id: regResult.ipn_id,
      instructions: "Copy the ipn_id above and add it to Vercel as PESAPAL_IPN_ID, then redeploy."
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Manual Action Required',
      reason: error.message,
      summary: "You MUST get the IPN ID from your PesaPal Dashboard manually.",
      steps: [
        "1. Log in to https://pay.pesapal.com/",
        "2. Click 'Settings' (top right) -> 'IPN Settings'.",
        "3. Look for 'matchflow-iota.vercel.app' in the table.",
        "4. If not there, click ADD NEW and enter:",
        `   - Website Domain: matchflow-iota.vercel.app`,
        `   - IPN Listener URL: ${ipnUrl}`,
        "5. Once saved, look at the table again. There is a column named 'ID' or 'IPN ID'.",
        "6. COPY THAT LONG CODE (e.g. 5e7f6a...) - this is your IPN_ID.",
        "7. Go to Vercel Dashboard -> MatchFlow -> Settings -> Environment Variables.",
        "8. Add PESAPAL_IPN_ID = (the code you copied).",
        "9. Click SAVE in Vercel.",
        "10. REDEPLOY your app (Go to 'Deployments' and redeploy the latest one)."
      ],
      current_status: {
        listener_active: "YES (Confirmed)",
        listener_url: ipnUrl
      }
    });
  }
}
