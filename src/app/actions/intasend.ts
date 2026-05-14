'use server';

import { INTASEND_CONFIG } from '@/lib/intasend-config';

/**
 * Initiates an IntaSend checkout.
 */
export async function initiateIntaSendPayment(amount: number, user: { uid: string, email: string, name: string }) {
  if (!INTASEND_CONFIG.SECRET_KEY) {
    return { success: false, error: "IntaSend Secret Key is missing." };
  }

  try {
    const response = await fetch(`${INTASEND_CONFIG.BASE_URL}/checkout/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTASEND_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: "KES",
        email: user.email,
        first_name: user.name.split(' ')[0] || "User",
        last_name: user.name.split(' ')[1] || "MatchFlow",
        external_id: `MF-${Date.now()}-${user.uid.substring(0, 5)}`,
        redirect_url: "https://matchflow-iota.vercel.app/recharge",
      }),
    });

    const data = await response.json();

    if (response.ok && data.url) {
      return { success: true, url: data.url };
    }

    return { 
      success: false, 
      error: data.errors?.[0]?.message || data.message || "Failed to initiate IntaSend checkout." 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
