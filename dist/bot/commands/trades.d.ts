import { ChatInputCommandInteraction } from 'discord.js';
/**
 * Trades command - handles all trade-related functionality
 * This command allows users to view recent trades, search trade history,
 * and get detailed information about specific trades
 */
export declare const tradesCommand: {
    data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
    autocomplete(interaction: any): Promise<void>;
};
//# sourceMappingURL=trades.d.ts.map