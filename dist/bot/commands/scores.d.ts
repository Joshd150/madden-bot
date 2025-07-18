import { ChatInputCommandInteraction } from 'discord.js';
/**
 * Scores command - handles all game score and schedule functionality
 * This command allows users to view recent games, upcoming schedules,
 * and detailed game information with comprehensive statistics
 */
export declare const scoresCommand: {
    data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
    autocomplete(interaction: any): Promise<void>;
};
//# sourceMappingURL=scores.d.ts.map