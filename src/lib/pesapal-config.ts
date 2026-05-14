/**
 * @fileOverview PesaPal Live Configuration
 */

export const PESAPAL_CONFIG = {
  // Use the key provided by the user. 
  // IMPORTANT: Replace the secret placeholder with your actual secret from PesaPal dashboard.
  CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY || "+j6AMtLc7pWxJeMYW5dU1pi6yNoqk46D",
  CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET || "REPLACE_WITH_YOUR_ACTUAL_LIVE_SECRET",
  
  // Once you get this from /api/pesapal/setup, paste it here:
  IPN_ID: process.env.PESAPAL_IPN_ID || "", 
  
  BASE_URL: "https://pay.pesapal.com/v3", // LIVE API URL
  IPN_URL: "https://matchflow-iota.vercel.app/api/pesapal-ipn"
};
