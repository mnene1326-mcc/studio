'use server';

/**
 * @fileOverview Server actions for PesaPal v3 integration.
 * Handles authentication, transaction initiation, and IPN registration.
 */

const PESAPAL_BASE_URL = process.env.PESAPAL_SANDBOX === 'true' 
  ? 'https://cybqa.pesapal.com/pesapalv3' 
  : 'https://pay.pesapal.com/v3';

/**
 * Gets an access token from PesaPal using Consumer Key and Secret.
 */
export async function getAccessToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('PesaPal credentials are not configured in environment variables.');
  }

  const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
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
 * Registers an IPN URL with PesaPal and returns the IPN ID.
 * @param url - The site URL (e.g., https://matchflow-iota.vercel.app)
 */
export async function registerIPN(url: string) {
  try {
    const token = await getAccessToken();
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const ipnUrl = `${cleanUrl}/api/pesapal/ipn`;

    const response = await fetch(`${PESAPAL_BASE_URL}/api/Services/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'GET',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register IPN');
    }

    const data = await response.json();
    return {
      ipn_id: data.ipn_id,
      url: data.url,
      status: data.status
    };
  } catch (error: any) {
    console.error('PesaPal IPN Error:', error);
    throw new Error(error.message || 'IPN registration failed.');
  }
}

/**
 * Initiates a PesaPal order for coin recharge.
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
      description: `Recharge for MatchFlow Coins - User: ${input.userId}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app'}/home`,
      notification_id: process.env.PESAPAL_IPN_ID, 
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
    console.error('PesaPal Payment Error:', error);
    throw new Error(error.message || 'Payment initiation failed.');
  }
}