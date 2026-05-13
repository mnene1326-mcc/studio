
'use server';

/**
 * @fileOverview Payment actions removed.
 */

export async function initiatePayment() {
  return { success: false, error: 'Payment service is currently disabled.' };
}
