
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
      return NextResponse.json({
        status: 'Authentication Failed',
        message: authResult.error,
        tip: "Ensure PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET are correct in Vercel."
      });
    }

    const regResult = await registerIPN(authResult.token);
    
    if ('error' in regResult) {
      return NextResponse.json({
        status: 'Manual Action Required',
        reason: regResult.error,
        summary: "PesaPal Live often requires manual IPN registration for security.",
        steps: [
          "1. Log in to your PesaPal Dashboard (https://pay.pesapal.com/).",
          "2. Navigate to 'Settings' (top right) -> 'IPN Settings'.",
          "3. Look for 'matchflow-iota.vercel.app' in the registered list.",
          "4. If not found, click 'ADD NEW' and enter:",
          `   - Website Domain: matchflow-iota.vercel.app`,
          `   - IPN Listener URL: ${ipnUrl}`,
          "5. Once saved, look at the table. Copy the 'ID' or 'IPN ID' column value.",
          "6. Add it to Vercel as PESAPAL_IPN_ID.",
          "7. Redeploy your app."
        ],
        current_status: {
          listener_url: ipnUrl,
          auth_token_received: "YES"
        }
      });
    }

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully via API.',
      ipn_id: regResult.ipn_id,
      instructions: "Copy the ipn_id above and add it to Vercel as PESAPAL_IPN_ID, then redeploy."
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Setup Error',
      message: error.message
    });
  }
}
