import { NextResponse } from 'next/server';
import { registerIPN, getIpnList } from '@/app/actions/pesapal';
import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * @fileOverview Setup tool to retrieve IPN ID from PesaPal Live using Vercel Env Vars.
 */
export async function GET() {
  if (!PESAPAL_CONFIG.CONSUMER_KEY || !PESAPAL_CONFIG.CONSUMER_SECRET) {
    return NextResponse.json({
      status: "Error",
      message: "PesaPal credentials missing. Ensure PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET are set in Vercel Environment Variables."
    }, { status: 400 });
  }

  try {
    // 1. Try to register new IPN for the current domain
    const registrationResult = await registerIPN();
    
    // 2. Fetch all currently registered IPNs for this account
    const ipnList = await getIpnList();

    return NextResponse.json({
      message: "PesaPal Live Diagnostics",
      status: "Connected",
      credentials_check: {
        key_length: PESAPAL_CONFIG.CONSUMER_KEY.length,
        secret_length: PESAPAL_CONFIG.CONSUMER_SECRET.length,
      },
      instruction: "Check 'currently_registered_ipns' below. Find the entry for your URL and copy its 'ipn_id' into Vercel ENV as PESAPAL_IPN_ID.",
      registration_attempt: registrationResult,
      currently_registered_ipns: ipnList
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Diagnostics Failed",
      message: error.message
    }, { status: 500 });
  }
}
