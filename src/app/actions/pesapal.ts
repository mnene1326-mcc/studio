
'use server';

/**
 * @fileOverview PesaPal v3 Live Production actions.
 */

const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';

async function safeJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`PesaPal returned non-JSON response (Status: ${response.status}). This usually means a configuration error or invalid keys.`);
  }
}

export async function getAccessToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('PesaPal credentials (KEY/SECRET) are missing in Vercel settings.');
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

  const data = await safeJson(response);
  if (!response.ok || !data.token) {
    throw new Error(`PesaPal Auth Failed: ${data.message || 'Unauthorized. Check your Live keys.'}`);
  }

  return data.token;
}

export async function registerIPN(token: string) {
  const appUrl = 'https://matchflow-iota.vercel.app';
  const ipnUrl = `${appUrl}/api/pesapal-ipn`;

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

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(`IPN Registration Failed: ${data.message || 'Unknown error'}`);
  }

  return data.ipn_id;
}

export async function getTransactionStatus(orderTrackingId: string) {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch transaction status.');
    }
    return data;
  } catch (error) {
    console.error('PesaPal Status Error:', error);
    return null;
  }
}

export async function initiatePayment(amount: number, userEmail: string, userId: string) {
  try {
    const token = await getAccessToken();
    const ipnId = process.env.PESAPAL_IPN_ID;

    if (!ipnId) {
      throw new Error('PESAPAL_IPN_ID is missing. You must get this from the PesaPal Dashboard IPN settings first.');
    }

    const merchantReference = `RECHARGE_${userId}_${amount}_${Date.now()}`;
    const appUrl = 'https://matchflow-iota.vercel.app';

    // PesaPal v3 requires a more complete billing address structure
    const payload = {
      id: merchantReference,
      currency: 'KES',
      amount: amount,
      description: `MatchFlow Recharge: ${amount} KES`,
      callback_url: `${appUrl}/home`,
      notification_id: ipnId,
      billing_address: {
        email_address: userEmail || 'guest@matchflow.app',
        phone_number: '',
        country_code: 'KE',
        first_name: 'MatchFlow',
        last_name: 'User',
        line_1: 'Nairobi',
        line_2: '',
        city: 'Nairobi',
        state: '',
        postal_code: '',
        zip_code: ''
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

    const data = await safeJson(response);
    if (!response.ok || !data.redirect_url) {
      throw new Error(data.message || 'Payment initiation failed. Check if IPN ID is valid.');
    }

    return { redirectUrl: data.redirect_url, merchantReference };
  } catch (error: any) {
    console.error('PesaPal Payment Error:', error);
    // Return a structured error so the client can show it without crashing
    throw new Error(error.message || 'Payment service unavailable.');
  }
}
