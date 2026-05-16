/**
 * @fileOverview Tencent RTC (TRTC) Configuration
 */

export const TRTC_CONFIG = {
  // Publicly accessible SDK App ID
  SDK_APP_ID: Number(process.env.NEXT_PUBLIC_TRTC_SDK_APP_ID) || 0,
  
  // Private Secret Key (Used only in Server Actions)
  SECRET_KEY: process.env.TRTC_SECRET_KEY || "",
};
