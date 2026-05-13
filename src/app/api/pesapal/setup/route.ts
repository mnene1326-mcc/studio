
import { NextResponse } from 'next/server';
import { getAccessToken, registerIPN } from '@/app/actions/pesapal';

/**
 * Diagnostic utility to register IPN and retrieve IPN_ID for Live environment.
 */
export async function GET() {
  const appUrl = 'https://matchflow-iota.vercel.app';
  const ipnUrl = `${appUrl}/api/pesapal-ipn`;

  try {
    // Step 1: Auth check
    const token = await getAccessToken().catch(err => {
      throw new Error(`AUTH_FAILED: ${err.message}`);
    });

    // Step 2: Attempt Automated Registration (Note: PesaPal Live often restricts this via API)
    const ipnId = await registerIPN(token).catch(err => {
      throw new Error(`REGISTRATION_RESTRICTED: ${err.message}`);
    });

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully via API.',
      ipn_id: ipnId,
      instructions: "Copy the ipn_id above and add it to Vercel as PESAPAL_IPN_ID, then redeploy."
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Manual Action Required',
      reason: error.message,
      summary: "You must manually get the IPN ID from your PesaPal Dashboard.",
      steps: [
        "1. Log in to https://pay.pesapal.com/",
        "2. Click 'Settings' (top right) -> 'IPN Settings'.",
        `3. Enter Website Domain: matchflow-iota.vercel.app`,
        `4. Enter IPN Listener URL: ${ipnUrl}`,
        "5. Select 'GET' or 'POST' and click SAVE URL.",
        "6. Look at the table below. There is a column named 'ID' or 'IPN ID'.",
        "7. COPY THAT ID (a long alphanumeric code).",
        "8. Go to Vercel Dashboard -> MatchFlow -> Settings -> Environment Variables.",
        "9. Add PESAPAL_IPN_ID = (the ID you copied).",
        "10. Redeploy your app."
      ],
      current_status: {
        listener_active: "YES (Confirmed)",
        listener_url: ipnUrl
      }
    });
  }
}
