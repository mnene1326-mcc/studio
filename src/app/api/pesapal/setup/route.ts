
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
      throw new Error(`Auth Failed: ${err.message}. Ensure your Live PESAPAL_CONSUMER_KEY and SECRET are in Vercel Environment Variables.`);
    });

    // Step 2: Try Automated Registration
    const ipnId = await registerIPN(token).catch(err => {
      throw new Error(`Automated registration is restricted by PesaPal: ${err.message}`);
    });

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully via API.',
      ipn_id: ipnId,
      ipn_url: ipnUrl,
      next_step: 'Copy the ipn_id above and add it to Vercel as PESAPAL_IPN_ID, then redeploy.'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Manual Action Required',
      reason: error.message,
      instructions: "Automated registration failed. Please follow these steps to get your IPN ID manually:",
      steps: [
        "1. Log in to your PesaPal Dashboard (Live).",
        "2. Go to Settings -> IPN Settings.",
        `3. Enter Website Domain: matchflow-iota.vercel.app`,
        `4. Enter IPN Listener URL: ${ipnUrl}`,
        "5. Select 'GET' or 'POST' and click SAVE.",
        "6. Once saved, look at the table on that page. Copy the value from the 'ID' or 'IPN ID' column.",
        "7. Go to Vercel -> Settings -> Environment Variables.",
        "8. Create PESAPAL_IPN_ID with the value you copied.",
        "9. Redeploy your app."
      ],
      validation_check: {
        listener_url: ipnUrl,
        status: "Listener is active and reachable if you see 'OK' when visiting it directly."
      }
    }, { status: 200 });
  }
}
