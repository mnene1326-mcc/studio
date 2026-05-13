
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
      throw new Error(`Auth Failed: ${err.message}. Ensure your Live Keys are in Environment Variables.`);
    });

    // Step 2: Register IPN via API
    // Note: If this fails with a JSON error, it usually means PesaPal's automated 
    // registration is down. In that case, use the manual dashboard method.
    const ipnId = await registerIPN(token).catch(err => {
      throw new Error(`Automated Registration Failed: ${err.message}`);
    });

    return NextResponse.json({
      status: 'Success',
      message: 'IPN Registered successfully via API.',
      ipn_id: ipnId,
      ipn_url: ipnUrl,
      next_step: 'Add the "ipn_id" above to your Environment Variables as PESAPAL_IPN_ID and redeploy.'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Setup Note',
      error: error.message,
      manual_solution: {
        instructions: "If automated registration fails, please register manually in the PesaPal Dashboard.",
        website_domain: "matchflow-iota.vercel.app",
        ipn_listener_url: ipnUrl,
        what_to_do: "After saving in the dashboard, copy the IPN ID provided there and add it to Vercel as PESAPAL_IPN_ID."
      }
    }, { status: 200 }); // Return 200 so you can read the manual instructions in the browser
  }
}
