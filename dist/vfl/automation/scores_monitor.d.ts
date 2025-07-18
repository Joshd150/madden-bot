/**
 * Interface for our game data structure
 */
interface GameData {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamAbbr: string;
    awayTeamAbbr: string;
    homeScore: number;
    awayScore: number;
    gameDate: any;
    week: number;
    season: number;
    status: 'scheduled' | 'in_progress' | 'completed';
    venue?: string;
    stats?: any;
    postedToDiscord: boolean;
    discordMessageId?: string;
}
/**
 * Starts the scores monitoring system
 * This sets up real-time listeners for game updates
 */
export declare function startScoresMonitor(): Promise<void>;
/**
 * Posts a completed game to all configured scores channels
 */
declare function postGameToAllChannels(game: GameData): Promise<void>;
/**
 * Posts a game result to a specific Discord channel
 */
declare function postGameToChannel(game: GameData, guildId: string, channelId: string): Promise<import("../../discord/settings_db").MessageId>;
/**
 * Manual function to post a specific game
 */
export declare function postGameManually(gameId: string): Promise<void>;
/**
 * Check for missed game results and post them
 */
export declare function checkForMissedGames(): Promise<void>;
export { postGameToAllChannels, postGameToChannel };
//# sourceMappingURL=scores_monitor.d.ts.map