
'use server';

/**
 * @fileOverview InstaSend payment actions for MatchFlow.
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
    return { success: false, error: 'Payment gateway not configured. Please add INSTASEND_API_KEY to environment variables.' };
  }

  try {
    const isLive = !apiKey.startsWith('ts_'); // Simple check for test vs live keys
    const baseUrl = isLive 
      ? 'https://api.instasend.co/api/v1/checkout/' 
      : 'https://sandbox.instasend.co/api/v1/checkout/';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        api_key: apiKey,
        first_name: input.name.split(' ')[0] || 'User',
        last_name: input.name.split(' ').slice(1).join(' ') || 'MatchFlow',
        email: input.email,
        amount: input.amount,
        currency: 'KES',
        label: `Recharge ${input.packageAmount} Coins`,
        external_id: `${input.uid}-${Date.now()}`,
        metadata: {
          uid: input.uid,
          packageAmount: input.packageAmount.toString()
        },
        redirect_url: `https://matchflow-iota.vercel.app/recharge?status=success`,
      }),
    });

    const data = await response.json();

    if (data.url) {
      return { success: true, url: data.url };
    } else {
      console.error('InstaSend Error:', data);
      return { success: false, error: data.message || 'Failed to initiate checkout.' };
    }
  } catch (error: any) {
    console.error('Payment Action Error:', error);
    return { success: false, error: 'Internal server error during payment initiation.' };
  }
}
