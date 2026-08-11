import dotenv from "dotenv";

dotenv.config();

const config = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/fitlink",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  EXPIRY_SWEEP_INTERVAL_MS:
    parseInt(process.env.EXPIRY_SWEEP_INTERVAL_MS, 10) || 60000,

  // Paymob
  PAYMOB_SECRET_KEY: process.env.PAYMOB_SECRET_KEY,
  PAYMOB_PUBLIC_KEY: process.env.PAYMOB_PUBLIC_KEY,
  PAYMOB_HMAC_KEY: process.env.PAYMOB_HMAC_KEY,
  PAYMOB_INTEGRATION_ID: process.env.PAYMOB_INTEGRATION_ID,
  PAYMOB_IFRAME_ID: process.env.PAYMOB_IFRAME_ID, // needed for MIGS/legacy integrations

};

export default config;
