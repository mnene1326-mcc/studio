
import { NextResponse } from 'next/server';
import { registerIPN } from '@/app/actions/pesapal';

/**
 * A direct endpoint that can be "run" in the browser to register the PesaPal IPN.
 * Usage: Visit /api/pesapal/setup
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!appUrl) {
    return NextResponse.json({ 
      error: 'NEXT_PUBLIC_APP_URL environment variable is missing.',
      fix: 'Please add NEXT_PUBLIC_APP_URL (e.g., https://your-app.com) to your environment variables.'
    }, { status: 500 });
  }

  try {
    const result = await registerIPN(appUrl);
    return NextResponse.json({ 
      status: 'Success',
      message: 'PesaPal IPN Registration Completed', 
      ipn_id: result.ipn_id,
      registered_url: result.url,
      next_step: 'Copy the ipn_id above and add it to your environment variables as PESAPAL_IPN_ID to enable live payments.'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'Error',
      message: error.message || 'Failed to register IPN'
    }, { status: 500 });
  }
}
