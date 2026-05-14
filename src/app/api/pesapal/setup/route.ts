import { NextResponse } from 'next/server';
import { registerIPN, getIpnList } from '@/app/actions/pesapal';

export async function GET() {
  // 1. Try to register new IPN
  const registrationResult = await registerIPN();
  
  // 2. Fetch existing list
  const ipnList = await getIpnList();

  return NextResponse.json({
    message: "PesaPal Setup Diagnostics (LIVE)",
    instruction: "Look for the 'ipn_id' below. Copy it and paste it into src/lib/pesapal-config.ts or add as PESAPAL_IPN_ID env var.",
    registration_attempt: registrationResult,
    currently_registered_ipns: ipnList
  });
}
