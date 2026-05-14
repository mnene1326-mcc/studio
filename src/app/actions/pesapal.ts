'use server';

import { PESAPAL_CONFIG } from '@/lib/pesapal-config';

/**
 * Fetches the Access Token from PesaPal Live API with robust error handling.
 */
export async function getAccessToken() {
  if (!PESAPAL_CONFIG.CONSUMER_KEY || !PESAPAL_CONFIG.CONSUMER_SECRET) {
    return { error: "PesaPal credentials missing. Please check your environment variables." };
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
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { error: `Invalid response format from PesaPal (Status ${response.status}): ${text.substring(0, 200)}` };
    }

    if (data.token) return { token: data.token };
    return { error: data.error?.message || data.message || `Auth failed with status ${response.status}` };
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

  const orderData = {
    id: `MF-${Date.now()}-${user.uid.substring(0, 5)}`,
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
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { success: false, error: `Order request failed (Status ${response.status}): ${text.substring(0, 200)}` };
    }

    if (data.redirect_url) {
      return { success: true, redirect_url: data.redirect_url, order_tracking_id: data.order_tracking_id };
    }
    return { success: false, error: data.error?.message || data.message || `Order failed with status ${response.status}` };
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
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/URLRegisterIPN`, {
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
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: `Register IPN failed (Status ${response.status}): ${text.substring(0, 200)}` };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Lists all registered IPNs for this account.
 */
export async function getIpnList() {
  const tokenRes = await getAccessToken();
  if (tokenRes.error) return { error: tokenRes.error };

  try {
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/GetIpnList`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenRes.token}`,
        'Accept': 'application/json',
      }
    });
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: `Get IPN list failed (Status ${response.status}): ${text.substring(0, 200)}` };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}
