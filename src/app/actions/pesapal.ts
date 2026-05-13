'use server';

/**
 * @fileOverview Server actions for PesaPal v3 integration.
 * Handles authentication, transaction initiation, and IPN registration.
 * Explicitly uses Live endpoints unless PESAPAL_SANDBOX is 'true'.
 */

const PESAPAL_BASE_URL = process.env.PESAPAL_SANDBOX === 'true' 
  ? 'https://cybqa.pesapal.com/pesapalv3' 
  : 'https://pay.pesapal.com/v3';

/**
 * Gets an access token from PesaPal using Consumer Key and Secret from Vercel Envs.
 */
export async function getAccessToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('Vercel Config Error: PESAPAL_CONSUMER_KEY or SECRET is missing.');
  }

  try {
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

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `PesaPal Auth Failed (Status ${response.status}): `;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage += errorJson.message || 'Unknown error';
      } catch (e) {
        errorMessage += responseText.substring(0, 100); // Show start of HTML if it's not JSON
      }
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    return data.token;
  } catch (error: any) {
    throw new Error(`PesaPal Connection Error: ${error.message}`);
  }
}

/**
 * Registers an IPN URL with PesaPal and returns the IPN ID.
 * Used by the /api/pesapal/setup endpoint.
 */
export async function registerIPN(url: string) {
  const token = await getAccessToken();
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const ipnUrl = `${cleanUrl}/api/pesapal/ipn`;

  try {
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

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `IPN Registration Failed (Status ${response.status}): `;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage += errorJson.message || 'Unknown error';
      } catch (e) {
        errorMessage += responseText.substring(0, 100);
      }
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  } catch (error: any) {
    throw new Error(`IPN Registration Error: ${error.message}`);
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
    const ipnId = process.env.PESAPAL_IPN_ID;

    if (!ipnId) {
      return { 
        success: false, 
        error: "Missing PESAPAL_IPN_ID in Vercel. Run the setup link to get one." 
      };
    }

    const orderData = {
      id: trackingId,
      currency: 'KES',
      amount: input.amount,
      description: `MatchFlow Coins - User: ${input.userId}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://matchflow-iota.vercel.app'}/home`,
      notification_id: ipnId, 
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

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return { success: false, error: `Invalid PesaPal response (Status ${response.status}): ${responseText.substring(0, 100)}` };
    }

    if (!response.ok) {
      return { success: false, error: data.message || 'PesaPal Live Order Submission Failed.' };
    }

    const redirectUrl = data.redirect_url || data.redirectUrl || data.message;

    if (!redirectUrl || typeof redirectUrl !== 'string' || !redirectUrl.startsWith('http')) {
      return { 
        success: false, 
        error: `Order accepted but no valid redirect URL returned. Message: ${data.message || 'Unknown'}` 
      };
    }

    return {
      success: true,
      redirect_url: redirectUrl,
      order_tracking_id: data.order_tracking_id,
    };
  } catch (error: any) {
    console.error('PesaPal Live Error:', error);
    return { success: false, error: error.message || 'Live payment initiation failed.' };
  }
}
