/**
 * @fileOverview PesaPal Live Configuration
 */

export const PESAPAL_CONFIG = {
  // PesaPal Live Credentials (Hardcoded for testing as requested)
  CONSUMER_KEY: "+j6AMtLc7pWxJeMYW5dU1pi6yNoqk46D",
  CONSUMER_SECRET: "AENKdAqQnK3MxzEcmX7n90GRHOQ=",
  
  // IPN ID from PesaPal dashboard or setup tool
  // This is the ONLY thing missing. Get it from /api/pesapal/setup
  IPN_ID: process.env.PESAPAL_IPN_ID || "", 
  
  BASE_URL: "https://pay.pesapal.com/v3", // LIVE API URL
  IPN_URL: "https://matchflow-iota.vercel.app/api/pesapal-ipn"
};
