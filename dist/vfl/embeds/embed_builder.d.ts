import { APIEmbed, APIEmbedField } from "discord-api-types/v10";
/**
 * VFL Manager Embed Builder - Creates beautiful, consistent embeds for all bot responses
 *
 * This class is the heart of our visual design system. Every message the bot sends
 * uses these embeds to ensure a professional, polished appearance that users love.
 * Think of this as our "brand guidelines" in code form!
 */
export declare enum VFLColor {
    PRIMARY = 2067276,// Our signature green - used for general info
    SUCCESS = 5763719,// Bright green for successful operations
    WARNING = 16705372,// Yellow for warnings and cautions
    ERROR = 15548997,// Red for errors and problems
    INFO = 5793266,// Discord's blurple for informational content
    SECONDARY = 10070709,// Gray for secondary information
    TRADE = 16739125,// Orange for trade announcements - makes them pop!
    GAME = 4286945,// Royal blue for game-related content
    PLAYER = 10040012,// Purple for player profiles and stats
    TEAM = 16766720
}
export declare class VFLEmbedBuilder {
    private embed;
    constructor();
    /**
     * Creates a stunning trade announcement embed
     * This is what users see when trades happen - we want it to look amazing!
     */
    static createTradeEmbed(trade: any): VFLEmbedBuilder;
    /**
     * Creates a comprehensive game result embed
     * Perfect for showing final scores, live updates, or upcoming games
     */
    static createGameEmbed(game: any): VFLEmbedBuilder;
    /**
     * Creates an incredibly detailed game breakdown embed
     * This is our premium feature - comprehensive game analysis that looks professional
     */
    static createGameBreakdownEmbed(game: any, stats: any): VFLEmbedBuilder;
    /**
     * Creates a detailed player profile embed
     * Shows everything you'd want to know about a player
     */
    static createPlayerEmbed(player: any): VFLEmbedBuilder;
    /**
     * Creates a comprehensive team overview embed
     * Perfect for showing team stats, roster info, and recent performance
     */
    static createTeamEmbed(team: any): VFLEmbedBuilder;
    /**
     * Creates beautiful league standings embeds
     * Can show full league or filter by conference/division
     */
    static createStandingsEmbed(standings: any[], conference?: string): VFLEmbedBuilder;
    static createSuccessEmbed(title: string, description?: string): VFLEmbedBuilder;
    static createErrorEmbed(title: string, description?: string): VFLEmbedBuilder;
    static createWarningEmbed(title: string, description?: string): VFLEmbedBuilder;
    static createInfoEmbed(title: string, description?: string): VFLEmbedBuilder;
    setTitle(title: string): this;
    setDescription(description: string): this;
    setColor(color: VFLColor | number): this;
    setThumbnail(url: string): this;
    setImage(url: string): this;
    setFooter(text: string, iconUrl?: string): this;
    addField(name: string, value: string, inline?: boolean): this;
    addFields(fields: APIEmbedField[]): this;
    setTimestamp(timestamp?: Date): this;
    build(): APIEmbed;
}
//# sourceMappingURL=embed_builder.d.ts.map