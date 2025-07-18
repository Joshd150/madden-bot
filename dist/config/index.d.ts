/**
 * Configuration object that centralizes all environment variables and settings
 * This makes it easy to manage different environments (dev, staging, production)
 * and ensures all configuration is in one place for easy maintenance
 */
declare const config: {
    discord: {
        token: string;
        clientId: string;
        guildId: string;
    };
    database: {
        path: string;
    };
    server: {
        port: number;
        host: string;
        nodeEnv: string;
    };
    admin: {
        username: string;
        password: string;
        jwtSecret: string;
    };
    sportsApi: {
        key: string;
        url: string;
    };
    bot: {
        prefix: string;
        defaultEmbedColor: string;
        teamLogoBaseUrl: string;
    };
    website: {
        title: string;
        description: string;
        discordInviteUrl: string;
    };
    automation: {
        autoPostTrades: boolean;
        autoPostScores: boolean;
        tradeCheckInterval: number;
        scoreCheckInterval: number;
    };
    logging: {
        level: string;
        file: string;
    };
};
export { config };
/**
 * Validates that all required configuration values are present
 * This helps catch configuration errors early in development
 */
export declare function validateConfig(): void;
export default config;
//# sourceMappingURL=index.d.ts.map