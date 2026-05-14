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

    const data = await response.json();
    if (response.ok && data.token) {
      return { token: data.token };
    }
    return { error: data.error?.message || data.message || "Authentication failed." };
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
    return { success: false, error: "IPN ID missing. Please configure it in Vercel or the config file." };
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

    const data = await response.json();
    if (response.ok && data.redirect_url) {
      return { success: true, redirect_url: data.redirect_url };
    }
    return { success: false, error: data.error?.message || data.message || "Failed to initiate payment." };
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

    return await response.json();
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
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/GetIpnList`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenRes.token}`,
        'Accept': 'application/json',
      }
    });
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}
