/**
 * @fileOverview IntaSend Configuration
 */

export const INTASEND_CONFIG = {
  PUBLISHABLE_KEY: process.env.INTASEND_PUBLISHABLE_KEY || "",
  SECRET_KEY: process.env.INTASEND_SECRET_KEY || "",
  IS_TEST: process.env.NODE_ENV !== 'production',
  BASE_URL: "https://payment.intasend.com/api/v1",
};
