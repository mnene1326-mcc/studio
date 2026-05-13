
'use server';

/**
 * PesaPal actions removed.
 */
export async function getAccessToken() {
  return { error: 'Service unavailable' };
}

export async function initiatePayment() {
  return { success: false, error: 'Payment service is currently disabled.' };
}
