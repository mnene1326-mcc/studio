'use server';

/**
 * @fileOverview InstaSend payment actions for MatchFlow.
 * Handles checkout initiation with robust error handling and logging.
 */

interface PaymentInput {
  amount: number;
  email: string;
  name: string;
  uid: string;
  packageAmount: number;
}

export async function initiatePayment(input: PaymentInput) {
  const apiKey = process.env.INSTASEND_API_KEY;

  if (!apiKey) {
    console.error('InstaSend Error: INSTASEND_API_KEY is missing from environment variables.');
    return { success: false, error: 'Payment gateway not configured. Please add INSTASEND_API_KEY to environment variables.' };
  }

  try {
    // InstaSend keys usually start with 'ts_' for test or 'pk_' for live
    const isLive = !apiKey.startsWith('ts_');
    const baseUrl = isLive 
      ? 'https://api.instasend.co/api/v1/checkout/' 
      : 'https://sandbox.instasend.co/api/v1/checkout/';

    // Ensure we have both first and last name for InstaSend
    const nameParts = (input.name || 'MatchFlow User').trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    console.log(`Initiating InstaSend payment for UID: ${input.uid}, Env: ${isLive ? 'Live' : 'Sandbox'}`);

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        first_name: firstName,
        last_name: lastName,
        email: input.email,
        amount: input.amount,
        currency: 'KES',
        label: `Recharge ${input.packageAmount} Coins`,
        external_id: `${input.uid}-${Date.now()}`,
        metadata: JSON.stringify({
          uid: input.uid,
          packageAmount: input.packageAmount.toString()
        }),
        redirect_url: `https://matchflow-iota.vercel.app/recharge?status=success`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('InstaSend API Error Response:', data);
      return { 
        success: false, 
        error: data.message || data.errors?.message || `Gateway error (${response.status}). Please try again later.` 
      };
    }

    if (data.url) {
      return { success: true, url: data.url };
    } else {
      console.error('InstaSend Unexpected Response:', data);
      return { success: false, error: 'Failed to retrieve checkout URL from payment gateway.' };
    }
  } catch (error: any) {
    console.error('Payment Action Exception:', error);
    return { 
      success: false, 
      error: 'A connection error occurred with the payment provider. Please check your internet and try again.' 
    };
  }
}
