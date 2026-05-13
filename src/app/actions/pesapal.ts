
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
    return { error: true, message: `PesaPal returned non-JSON response (Status: ${response.status}).`, raw: text.substring(0, 200) };
  }
}

export async function getAccessToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return { error: 'PesaPal credentials (KEY/SECRET) are missing in environment variables.' };
  }

  try {
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
    if (data.error || !response.ok || !data.token) {
      return { error: `PesaPal Auth Failed: ${data.message || 'Unauthorized. Check your Live keys.'}` };
    }

    return { token: data.token };
  } catch (err: any) {
    return { error: `Connection failed: ${err.message}` };
  }
}

export async function getIPNList(token: string) {
  try {
    const response = await fetch(`${PESAPAL_BASE_URL}/api/Queues/GetIPNs`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await safeJson(response);
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function registerIPN(token: string) {
  const appUrl = 'https://matchflow-iota.vercel.app';
  const ipnUrl = `${appUrl}/api/pesapal-ipn`;

  try {
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
    if (!response.ok || data.error || !data.ipn_id) {
      return { error: data.message || `API Registration Restricted (Status: ${response.status}).` };
    }

    return { ipn_id: data.ipn_id };
  } catch (err: any) {
    return { error: `Registration request failed: ${err.message}` };
  }
}

export async function getTransactionStatus(orderTrackingId: string) {
  try {
    const authResult = await getAccessToken();
    if ('error' in authResult) return null;

    const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResult.token}`,
      },
    });

    const data = await safeJson(response);
    if (!response.ok) return null;
    return data;
  } catch (error) {
    return null;
  }
}

export async function initiatePayment(amount: number, userEmail: string, userId: string) {
  try {
    const ipnId = process.env.PESAPAL_IPN_ID;

    if (!ipnId) {
      return { 
        success: false, 
        error: 'MISSING_IPN_ID: Please visit /api/pesapal/setup to find your IPN ID, then add it to Vercel.' 
      };
    }

    const authResult = await getAccessToken();
    if ('error' in authResult) {
      return { success: false, error: authResult.error };
    }

    const merchantReference = `RECHARGE_${userId}_${amount}_${Date.now()}`;
    const appUrl = 'https://matchflow-iota.vercel.app';

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
        city: 'Nairobi',
        state: 'Nairobi',
        postal_code: '00100'
      },
    };

    const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResult.token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(response);
    if (!response.ok || !data.redirect_url || data.error) {
      return { success: false, error: data.message || 'Payment initiation failed.' };
    }

    return { success: true, redirectUrl: data.redirect_url, merchantReference };
  } catch (error: any) {
    return { success: false, error: error.message || 'Payment service unavailable.' };
  }
}
