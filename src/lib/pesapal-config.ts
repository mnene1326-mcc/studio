/**
 * @fileOverview PesaPal Live Configuration
 * Strictly uses environment variables for security and flexibility.
 */

export const PESAPAL_CONFIG = {
  // PesaPal Live Credentials from Vercel/Environment
  CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY || "",
  CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET || "",
  
  // IPN ID from PesaPal dashboard or setup tool
  IPN_ID: process.env.PESAPAL_IPN_ID || "", 
  
  BASE_URL: "https://pay.pesapal.com/v3", // LIVE API URL
  IPN_URL: "https://matchflow-iota.vercel.app/api/pesapal-ipn"
};
