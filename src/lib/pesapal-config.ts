/**
 * @fileOverview PesaPal Live Configuration
 */

export const PESAPAL_CONFIG = {
  // PesaPal Live Credentials
  CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY || "+j6AMtLc7pWxJeMYW5dU1pi6yNoqk46D",
  CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET || "AENKdAqQnK3MxzEcmX7n90GRHOQ=",
  
  // IPN ID from PesaPal dashboard or setup tool
  // Visit /api/pesapal/setup to get this.
  IPN_ID: process.env.PESAPAL_IPN_ID || "44ea6bc7-1865-4d88-99e6-da62d66142cb", 
  
  BASE_URL: "https://pay.pesapal.com/v3", // LIVE API URL
  IPN_URL: "https://matchflow-iota.vercel.app/api/pesapal-ipn"
};
