// Load environment variables with validation
import { config } from 'dotenv';
config();

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'PUBLIC_KEY', 
  'APP_ID',
  'DEPLOYMENT_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Export configuration with defaults
export const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL!;
export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Discord configuration
export const DISCORD_CONFIG = {
  token: process.env.DISCORD_TOKEN!,
  publicKey: process.env.PUBLIC_KEY!,
  appId: process.env.APP_ID!
};

// Database configuration
export const DATABASE_CONFIG = {
  emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
  serviceAccountFile: process.env.SERVICE_ACCOUNT_FILE,
  serviceAccount: process.env.SERVICE_ACCOUNT
};

// Web interface configuration
export const WEB_CONFIG = {
  jwtSecret: JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
};
