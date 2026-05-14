import { NextResponse } from 'next/server';
import { registerIPN, getIpnList } from '@/app/actions/pesapal';
import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * @fileOverview Setup tool to retrieve IPN ID from PesaPal Live.
 */
export async function GET() {
  if (!PESAPAL_CONFIG.CONSUMER_KEY || !PESAPAL_CONFIG.CONSUMER_SECRET) {
    return NextResponse.json({
      status: "Config Error",
      message: "PesaPal credentials missing. Please check src/lib/pesapal-config.ts"
    }, { status: 400 });
  }

  try {
    // 1. Fetch current list
    const ipnListResult = await getIpnList();
    
    // 2. Try to register (in case it doesn't exist)
    const registrationResult = await registerIPN();
    
    // 3. Re-fetch list to show the new ID
    const updatedListResult = await getIpnList();

    return NextResponse.json({
      message: "PesaPal Live Diagnostics",
      status: "Connected",
      credentials_check: {
        key_length: PESAPAL_CONFIG.CONSUMER_KEY.length,
        secret_length: PESAPAL_CONFIG.CONSUMER_SECRET.length,
      },
      instruction: "Look for the entry with your URL in 'currently_registered_ipns' below. Copy the 'ipn_id' and add it to your environment variables or config.",
      initial_list: ipnListResult,
      registration_attempt: registrationResult,
      currently_registered_ipns: updatedListResult
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Diagnostics Failed",
      message: error.message
    }, { status: 500 });
  }
}
