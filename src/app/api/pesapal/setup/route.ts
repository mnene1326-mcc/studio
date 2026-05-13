import { NextResponse } from 'next/server';
import { registerIPN } from '@/app/actions/pesapal';

/**
 * Direct endpoint to register the PesaPal IPN ID for the live site.
 * Visit /api/pesapal/setup in the browser.
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';
  
  try {
    const result = await registerIPN(appUrl);
    return NextResponse.json({ 
      status: 'Success',
      message: 'PesaPal IPN Registration Completed', 
      ipn_id: result.ipn_id,
      registered_url: result.url,
      next_step: 'Add this IPN_ID to your environment variables as PESAPAL_IPN_ID.'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'Error',
      message: error.message || 'Failed to register IPN'
    }, { status: 500 });
  }
}