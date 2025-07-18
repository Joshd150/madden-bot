/**
 * Interface for our trade data structure
 * This matches what we store in Firestore
 */
interface TradeData {
    id: string;
    fromTeamId: string;
    toTeamId: string;
    fromTeamName: string;
    toTeamName: string;
    players: Array<{
        name: string;
        position: string;
        fromTeam: string;
        toTeam: string;
    }>;
    draftPicks?: Array<{
        year: number;
        round: string;
        fromTeam: string;
        toTeam: string;
    }>;
    tradeDate: any;
    description?: string;
    analysis?: string;
    postedToDiscord: boolean;
    discordMessageId?: string;
}
/**
 * Main function that monitors for new trades
 * This runs continuously and posts new trades as they're added
 */
export declare function startTradesMonitor(): Promise<void>;
/**
 * Posts a trade to all configured trades channels across all servers
 * This ensures that every server with a trades channel gets the update
 */
declare function postTradeToAllChannels(trade: TradeData): Promise<void>;
/**
 * Posts a trade to a specific Discord channel
 * This creates the beautiful embed and sends it to the channel
 */
declare function postTradeToChannel(trade: TradeData, guildId: string, channelId: string): Promise<import("../../discord/settings_db").MessageId>;
/**
 * Manual function to post a specific trade
 * Useful for testing or re-posting trades if needed
 */
export declare function postTradeManually(tradeId: string): Promise<void>;
/**
 * Function to check for and post any missed trades
 * This is a safety net in case the real-time listener misses anything
 */
export declare function checkForMissedTrades(): Promise<void>;
export { postTradeToAllChannels, postTradeToChannel };
//# sourceMappingURL=trades_monitor.d.ts.map