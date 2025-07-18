import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration object that centralizes all environment variables and settings
 * This makes it easy to manage different environments (dev, staging, production)
 * and ensures all configuration is in one place for easy maintenance
 */
const config = {
  // Discord Bot Configuration
  // These are essential for connecting to Discord's API
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '', // For testing commands in specific server
  },

  // Database Configuration
  // Using SQLite for simplicity, but can be easily changed to PostgreSQL/MySQL
  database: {
    path: process.env.DATABASE_PATH || './data/vfl_manager.db',
  },

  // Web Server Configuration
  // Controls how the web portal and API endpoints are served
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Admin Portal Security
  // Used for authenticating admin users to the management portal
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'changeme',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  },

  // Sports API Integration
  // Configure external sports data providers if needed
  sportsApi: {
    key: process.env.SPORTS_API_KEY || '',
    url: process.env.SPORTS_API_URL || '',
  },

  // Bot Behavior Configuration
  // Customize how the bot behaves and appears
  bot: {
    prefix: process.env.BOT_PREFIX || '!',
    defaultEmbedColor: process.env.DEFAULT_EMBED_COLOR || '#1f8b4c',
    teamLogoBaseUrl: process.env.TEAM_LOGO_BASE_URL || 'https://example.com/logos/',
  },

  // Website Configuration
  // Settings for the public-facing website
  website: {
    title: process.env.WEBSITE_TITLE || 'VFL Manager Hub',
    description: process.env.WEBSITE_DESCRIPTION || 'Your premier destination for VFL trading and statistics',
    discordInviteUrl: process.env.DISCORD_INVITE_URL || 'https://discord.gg/your-invite',
  },

  // Automation Settings
  // Control automated features like trade posting and score updates
  automation: {
    autoPostTrades: process.env.AUTO_POST_TRADES === 'true',
    autoPostScores: process.env.AUTO_POST_SCORES === 'true',
    tradeCheckInterval: parseInt(process.env.TRADE_CHECK_INTERVAL || '300000'), // 5 minutes
    scoreCheckInterval: parseInt(process.env.SCORE_CHECK_INTERVAL || '600000'), // 10 minutes
  },

  // Logging Configuration
  // Control how the bot logs information for debugging and monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/bot.log',
  },
};

export { config };

/**
 * Validates that all required configuration values are present
 * This helps catch configuration errors early in development
 */
export function validateConfig(): void {
  const required = [
    'DISCORD_TOKEN',
    'DISCORD_CLIENT_ID',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default config;