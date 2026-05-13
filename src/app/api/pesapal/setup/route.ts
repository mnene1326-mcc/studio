import { NextResponse } from 'next/server';
import { registerIPN, getAccessToken } from '@/app/actions/pesapal';

/**
 * Diagnostic endpoint to register the PesaPal IPN ID for the live site.
 * Visit /api/pesapal/setup in the browser to get your IPN_ID.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';
  
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!key || !secret) {
    return NextResponse.json({ 
      status: 'Configuration Missing',
      message: 'PESAPAL_CONSUMER_KEY or SECRET is not set in Vercel.',
      debug: {
        NEXT_PUBLIC_APP_URL: appUrl
      }
    }, { status: 400 });
  }
  
  try {
    // Step 1: Verify Auth with PesaPal Live
    let token;
    try {
      token = await getAccessToken();
    } catch (authError: any) {
      return NextResponse.json({
        status: 'Step 1 Failed: Authentication',
        message: authError.message,
        tip: 'Ensure your Live PesaPal Consumer Key and Secret are correct.'
      }, { status: 401 });
    }

    // Step 2: Register IPN at /api/pesapal-ipn
    const result = await registerIPN(appUrl);
    
    return NextResponse.json({ 
      status: 'Success',
      message: 'Live PesaPal IPN Registered Successfully', 
      ipn_id: result.ipn_id,
      registered_url: result.url,
      token_verified: !!token,
      next_step: 'Add this IPN_ID to your Vercel Environment Variables as PESAPAL_IPN_ID.'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'Step 2 Failed: IPN Registration',
      message: error.message,
      tip: 'Verify your PesaPal account status and ensure the site URL is public.'
    }, { status: 500 });
  }
}