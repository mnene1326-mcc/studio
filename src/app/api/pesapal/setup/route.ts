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
      message: "PesaPal credentials missing."
    }, { status: 400 });
  }

  try {
    // 1. Try to register the IPN for the current domain
    const registrationResult = await registerIPN();
    
    // 2. Fetch all currently registered IPNs
    const ipnList = await getIpnList();

    // 3. Find if our URL is already in the list to make it easy for the user
    const currentIpn = Array.isArray(ipnList) 
      ? ipnList.find((item: any) => item.url === PESAPAL_CONFIG.IPN_URL)
      : null;

    return NextResponse.json({
      message: "PesaPal Live Diagnostics",
      status: "Connected",
      target_url: PESAPAL_CONFIG.IPN_URL,
      instruction: currentIpn 
        ? `SUCCESS! Your IPN ID is found. Copy the value of 'recommended_ipn_id' below into Vercel as PESAPAL_IPN_ID.` 
        : `Check 'currently_registered_ipns' below. If you don't see your URL, make sure it is publicly accessible.`,
      recommended_ipn_id: currentIpn?.ipn_id || "Not found yet - check list below",
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
