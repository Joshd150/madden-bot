"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEB_CONFIG = exports.DATABASE_CONFIG = exports.DISCORD_CONFIG = exports.JWT_SECRET = exports.NODE_ENV = exports.PORT = exports.DEPLOYMENT_URL = void 0;
// Load environment variables with validation
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
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
exports.DEPLOYMENT_URL = process.env.DEPLOYMENT_URL;
exports.PORT = process.env.PORT || 3000;
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
// Discord configuration
exports.DISCORD_CONFIG = {
    token: process.env.DISCORD_TOKEN,
    publicKey: process.env.PUBLIC_KEY,
    appId: process.env.APP_ID
};
// Database configuration
exports.DATABASE_CONFIG = {
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
    serviceAccountFile: process.env.SERVICE_ACCOUNT_FILE,
    serviceAccount: process.env.SERVICE_ACCOUNT
};
// Web interface configuration
exports.WEB_CONFIG = {
    jwtSecret: exports.JWT_SECRET,
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD
};
//# sourceMappingURL=config.js.map