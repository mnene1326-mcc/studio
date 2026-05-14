import { NextResponse } from 'next/server';
import { registerIPN, getIpnList } from '@/app/actions/pesapal';
import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * @fileOverview Setup tool to retrieve IPN ID from PesaPal Live.
 */
export async function GET() {
  if (PESAPAL_CONFIG.CONSUMER_SECRET === "REPLACE_WITH_YOUR_ACTUAL_LIVE_SECRET") {
    return NextResponse.json({
      error: "Missing Consumer Secret",
      instruction: "Please update src/lib/pesapal-config.ts with your actual PesaPal Consumer Secret first."
    }, { status: 400 });
  }

  // 1. Try to register new IPN for the current domain
  const registrationResult = await registerIPN();
  
  // 2. Fetch all currently registered IPNs for this account
  const ipnList = await getIpnList();

  return NextResponse.json({
    message: "PesaPal Live Diagnostics",
    status: "Connected",
    instruction: "Check 'currently_registered_ipns' below. Find the entry for your URL and copy its 'ipn_id' into src/lib/pesapal-config.ts.",
    registration_attempt: registrationResult,
    currently_registered_ipns: ipnList
  });
}
