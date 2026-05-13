
'use server';

/**
 * @fileOverview Server actions for PesaPal v3 integration.
 * Handles authentication and transaction initiation.
 */

const PESAPAL_BASE_URL = process.env.PESAPAL_SANDBOX === 'true' 
  ? 'https://cybqa.pesapal.com/pesapalv3' 
  : 'https://pay.pesapal.com/v3';

/**
 * Gets an access token from PesaPal using Consumer Key and Secret.
 */
async function getAccessToken() {
  const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to authenticate with PesaPal');
  }

  const data = await response.json();
  return data.token;
}

/**
 * Initiates a PesaPal order.
 */
export async function initiatePayment(input: {
  amount: number;
  email: string;
  phoneNumber?: string;
  name: string;
  userId: string;
}) {
  try {
    const token = await getAccessToken();
    const trackingId = crypto.randomUUID();

    const orderData = {
      id: trackingId,
      currency: 'KES',
      amount: input.amount,
      description: `Recharge ${input.amount} KES for MatchFlow Coins`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/home`,
      notification_id: process.env.PESAPAL_IPN_ID, // Pre-registered IPN ID from PesaPal dashboard
      billing_address: {
        email_address: input.email,
        phone_number: input.phoneNumber || '',
        country_code: 'KE',
        first_name: input.name.split(' ')[0] || 'User',
        last_name: input.name.split(' ').slice(1).join(' ') || 'MatchFlow',
      },
    };

    const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit PesaPal order');
    }

    const data = await response.json();
    return {
      redirect_url: data.redirect_url,
      order_tracking_id: data.order_tracking_id,
    };
  } catch (error: any) {
    console.error('PesaPal Error:', error);
    throw new Error(error.message || 'Payment initiation failed');
  }
}
