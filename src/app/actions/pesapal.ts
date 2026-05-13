
'use server';

/**
 * @fileOverview PesaPal v3 Live Production actions.
 */

const PESAPAL_BASE_URL = process.env.PESAPAL_SANDBOX === 'true' 
  ? 'https://cybqa.pesapal.com/pesapalv3' 
  : 'https://pay.pesapal.com/v3';

export async function getAccessToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('PesaPal credentials missing. Please set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET in environment variables.');
  }

  const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error(`PesaPal Auth Failed: ${data.message || 'Check your keys.'}`);
  }

  return data.token;
}

export async function registerIPN(token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';
  const ipnUrl = `${appUrl.replace(/\/$/, '')}/api/pesapal-ipn`;

  const response = await fetch(`${PESAPAL_BASE_URL}/api/Queues/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: 'GET',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`IPN Registration Failed: ${JSON.stringify(data)}`);
  }

  return data.ipn_id;
}

export async function initiatePayment(amount: number, userEmail: string, userId: string) {
  try {
    const token = await getAccessToken();
    const ipnId = process.env.PESAPAL_IPN_ID;

    if (!ipnId) {
      throw new Error('PESAPAL_IPN_ID is missing. Deploy your app and visit /api/pesapal/setup to get one.');
    }

    const merchantReference = `RECHARGE_${userId}_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app';

    const payload = {
      id: merchantReference,
      currency: 'KES',
      amount: amount,
      description: `Recharge coins for MatchFlow user ${userId}`,
      callback_url: `${appUrl}/home`,
      notification_id: ipnId,
      billing_address: {
        email_address: userEmail || 'guest@matchflow.app',
      },
    };

    const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.redirect_url) {
      throw new Error(data.message || 'Payment initiation failed.');
    }

    return { redirectUrl: data.redirect_url, merchantReference };
  } catch (error: any) {
    console.error('PesaPal Payment Error:', error);
    throw new Error(error.message || 'Payment service unavailable.');
  }
}
