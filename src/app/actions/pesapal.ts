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
 * Gets an access token from PesaPal using Consumer Key and Secret.
 */
export async function getAccessToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('Config Error: PESAPAL_CONSUMER_KEY or SECRET is missing in environment variables.');
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
      cache: 'no-store'
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `Auth Failed (Status ${response.status}): `;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage += errorJson.message || 'Unknown error';
      } catch (e) {
        errorMessage += responseText.substring(0, 150);
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
 */
export async function registerIPN(baseUrl: string) {
  const token = await getAccessToken();
  
  const cleanBaseUrl = baseUrl.replace(/\/$/, ""); 
  const ipnUrl = `${cleanBaseUrl}/api/pesapal/ipn`;

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
      cache: 'no-store'
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `IPN Registration Failed (Status ${response.status}): `;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage += errorJson.message || 'Unknown error';
      } catch (e) {
        errorMessage += responseText.substring(0, 150);
      }
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  } catch (error: any) {
    throw new Error(`IPN Registration Error: ${error.message}`);
  }
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
    const ipnId = process.env.PESAPAL_IPN_ID;

    if (!ipnId) {
      return { 
        success: false, 
        error: "Missing PESAPAL_IPN_ID. Please run the setup link to register your site IPN." 
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
      cache: 'no-store'
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return { success: false, error: `Invalid API response (Status ${response.status}): ${responseText.substring(0, 150)}` };
    }

    if (!response.ok) {
      return { success: false, error: data.message || 'Order submission failed.' };
    }

    const redirectUrl = data.redirect_url || data.redirectUrl;

    if (!redirectUrl) {
      return { 
        success: false, 
        error: `Order accepted but no redirect URL was returned. Response: ${JSON.stringify(data)}` 
      };
    }

    return {
      success: true,
      redirect_url: redirectUrl,
      order_tracking_id: data.order_tracking_id,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Payment initiation failed.' };
  }
}