/**
 * @fileOverview PesaPal Live Configuration
 * Replace the placeholder values with your actual PesaPal Live credentials.
 */

export const PESAPAL_CONFIG = {
  CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY || "REPLACE_WITH_YOUR_LIVE_KEY",
  CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET || "REPLACE_WITH_YOUR_LIVE_SECRET",
  IPN_ID: process.env.PESAPAL_IPN_ID || "", // Once you get this from /api/pesapal/setup, put it here
  BASE_URL: "https://pay.pesapal.com/v3", // LIVE API URL
  IPN_URL: "https://matchflow-iota.vercel.app/api/pesapal-ipn"
};
