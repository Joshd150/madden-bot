import { ParameterizedContext } from "koa";
import { APIChannel, APIGuildMember, APIMessage, InteractionResponseType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { CategoryId, ChannelId, MessageId, UserId } from "./settings_db";
export declare enum CommandMode {
    INSTALL = "INSTALL",
    DELETE = "DELETE"
}
export type DiscordError = {
    message: string;
    code: number;
    retry_after?: number;
};
export declare class DiscordRequestError extends Error {
    code: number;
    constructor(error: DiscordError);
    isPermissionError(): boolean;
}
export declare class SnallabotDiscordError extends Error {
    guidance: string;
    code: number;
    constructor(error: DiscordRequestError, guidance: string);
    isDeletedChannel(): boolean;
    isDeletedMessage(): boolean;
}
export interface DiscordClient {
    interactionVerifier(ctx: ParameterizedContext): Promise<boolean>;
    handleSlashCommand(mode: CommandMode, command: RESTPostAPIApplicationCommandsJSONBody, guild?: string): Promise<void>;
    editOriginalInteraction(token: string, body: {
        [key: string]: any;
    }): Promise<void>;
    createMessage(channel: ChannelId, content: string, allowedMentions: string[]): Promise<MessageId>;
    editMessage(channel: ChannelId, messageId: MessageId, content: string, allowedMentions: string[]): Promise<void>;
    deleteMessage(channel: ChannelId, messageId: MessageId): Promise<void>;
    createChannel(guild_id: string, channelName: string, category: CategoryId): Promise<ChannelId>;
    deleteChannel(channelId: ChannelId): Promise<void>;
    getChannel(channelId: ChannelId): Promise<APIChannel>;
    reactToMessage(reaction: String, messageId: MessageId, channel: ChannelId): Promise<void>;
    getUsersReacted(reaction: String, messageId: MessageId, channel: ChannelId): Promise<UserId[]>;
    getMessagesInChannel(channelId: ChannelId, before?: MessageId): Promise<APIMessage[]>;
    createThreadInChannel(channel: ChannelId, channelName: string): Promise<ChannelId>;
    checkMessageExists(channel: ChannelId, messageId: MessageId): Promise<boolean>;
    getUsers(guild_id: string): Promise<APIGuildMember[]>;
}
type DiscordSettings = {
    publicKey: string;
    botToken: string;
    appId: string;
};
export declare function createClient(settings: DiscordSettings): DiscordClient;
export declare function respond(ctx: ParameterizedContext, body: any): void;
export declare function createMessageResponse(content: string, options?: {}): {
    type: InteractionResponseType;
    data: {
        content: string;
    };
};
export declare function deferMessage(): {
    type: InteractionResponseType;
};
export declare function deferMessageInvisible(): {
    type: InteractionResponseType;
    data: {
        flags: number;
    };
};
export declare function formatTeamMessageName(discordId: string | undefined, gamerTag: string | undefined): string;
export declare const SNALLABOT_USER = "970091866450198548";
export declare const SNALLABOT_TEST_USER = "1099768386352840807";
export declare function createWeekKey(season: number, week: number): string;
export declare enum SnallabotReactions {
    SCHEDULE = "%E2%8F%B0",
    GG = "%F0%9F%8F%86",
    HOME = "%F0%9F%8F%A0",
    AWAY = "%F0%9F%9B%AB",
    SIM = "%E2%8F%AD%EF%B8%8F"
}
export {};
//# sourceMappingURL=discord_utils.d.ts.map