import { EmbedBuilder as DiscordEmbedBuilder, ColorResolvable } from 'discord.js';
/**
 * Custom embed builder that creates consistent, professional-looking embeds
 * for all bot responses. This ensures a cohesive visual experience across
 * all commands and automated posts.
 */
export declare class CustomEmbedBuilder {
    private embed;
    constructor();
    /**
     * Creates a trade announcement embed with professional formatting
     * This is used for automated trade posts and manual trade commands
     */
    static createTradeEmbed(trade: any): DiscordEmbedBuilder;
    /**
     * Creates a game score embed with comprehensive game information
     * Used for posting game results and live score updates
     */
    static createGameEmbed(game: any): DiscordEmbedBuilder;
    /**
     * Creates a detailed game breakdown embed with comprehensive statistics
     * This is used for the advanced game analysis command
     */
    static createGameBreakdownEmbed(game: any, stats: any): DiscordEmbedBuilder;
    /**
     * Creates a player statistics embed with comprehensive player data
     * Used for player lookup commands and player-focused content
     */
    static createPlayerEmbed(player: any): DiscordEmbedBuilder;
    /**
     * Creates a team overview embed with team statistics and roster highlights
     * Used for team information commands and team-focused content
     */
    static createTeamEmbed(team: any): DiscordEmbedBuilder;
    /**
     * Creates a league standings embed with formatted standings table
     * Used for standings commands and league overview content
     */
    static createStandingsEmbed(standings: any[], conference?: string): DiscordEmbedBuilder;
    /**
     * Creates an error embed for consistent error messaging
     * This ensures all errors are displayed in a user-friendly way
     */
    static createErrorEmbed(message: string, details?: string): DiscordEmbedBuilder;
    /**
     * Creates a success embed for positive confirmations
     * Used when commands execute successfully
     */
    static createSuccessEmbed(message: string, details?: string): DiscordEmbedBuilder;
    /**
     * Creates an info embed for general information
     * Used for help commands and informational responses
     */
    static createInfoEmbed(title: string, message: string): DiscordEmbedBuilder;
    setTitle(title: string): this;
    setDescription(description: string): this;
    setColor(color: ColorResolvable): this;
    addFields(...fields: any[]): this;
    setThumbnail(url: string): this;
    setImage(url: string): this;
    setFooter(options: {
        text: string;
        iconURL?: string;
    }): this;
    build(): DiscordEmbedBuilder;
}
//# sourceMappingURL=EmbedBuilder.d.ts.map