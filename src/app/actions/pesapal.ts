
'use server';

import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * Fetches the Access Token from PesaPal Live API.
 */
export async function getAccessToken() {
  if (!PESAPAL_CONFIG.CONSUMER_KEY || !PESAPAL_CONFIG.CONSUMER_SECRET) {
    return { error: "PesaPal credentials missing." };
  }

  try {
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONFIG.CONSUMER_KEY,
        consumer_secret: PESAPAL_CONFIG.CONSUMER_SECRET,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      return { error: `Auth failed (${response.status}): ${text.substring(0, 100)}` };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { error: `Auth returned non-JSON: ${text.substring(0, 100)}` };
    }
    
    if (data.token) {
      return { token: data.token };
    }
    
    return { error: data.message || "No token returned from PesaPal." };
  } catch (error: any) {
    return { error: `Fetch error: ${error.message}` };
  }
}

/**
 * Fetches transaction status from PesaPal.
 */
export async function getTransactionStatus(orderTrackingId: string) {
  const tokenRes = await getAccessToken();
  if (tokenRes.error) return { error: tokenRes.error };

  try {
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenRes.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      return { error: `Status check failed: ${response.status}` };
    }

    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Initiates a PesaPal transaction.
 */
export async function initiatePesaPalPayment(amount: number, user: { uid: string, email: string, name: string }) {
  const tokenRes = await getAccessToken();
  if (tokenRes.error) return { success: false, error: `Auth Error: ${tokenRes.error}` };

  if (!PESAPAL_CONFIG.IPN_ID) {
    return { success: false, error: "IPN ID missing. Please visit /api/pesapal/setup to register your IPN URL." };
  }

  // Merchant Reference includes full UID for reliable IPN processing
  const merchantReference = `MF_${user.uid}_${Date.now()}`;

  const orderData = {
    id: merchantReference,
    currency: "KES",
    amount: amount,
    description: "Recharge MatchFlow Coins",
    callback_url: "https://matchflow-iota.vercel.app/recharge",
    notification_id: PESAPAL_CONFIG.IPN_ID,
    billing_address: {
      email_address: user.email,
      phone_number: "",
      country_code: "KE",
      first_name: user.name.split(' ')[0] || "User",
      last_name: user.name.split(' ')[1] || "MatchFlow",
      line_1: "Nairobi",
      city: "Nairobi"
    }
  };

  try {
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenRes.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const text = await response.text();
    if (!response.ok) {
      return { success: false, error: `Order failed (${response.status}): ${text.substring(0, 150)}` };
    }

    const data = JSON.parse(text);
    if (data.redirect_url) {
      return { success: true, redirect_url: data.redirect_url };
    }
    return { success: false, error: data.message || "No redirect URL returned." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Registers an IPN URL and returns the IPN ID.
 */
export async function registerIPN() {
  const tokenRes = await getAccessToken();
  if (tokenRes.error) return { error: tokenRes.error };

  try {
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenRes.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: PESAPAL_CONFIG.IPN_URL,
        ipn_notification_type: "GET"
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      return { error: `Registration failed (${response.status}): ${text}` };
    }
    
    try {
      return JSON.parse(text);
    } catch {
      return { status: response.status, body: text };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Lists all registered IPNs.
 */
export async function getIpnList() {
  const tokenRes = await getAccessToken();
  if (tokenRes.error) return { error: tokenRes.error };

  try {
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/URLSetup/GetIpnList`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenRes.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const text = await response.text();
    if (!response.ok) {
      return { error: `GetList failed (${response.status}): ${text}` };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { status: response.status, body: text };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}
