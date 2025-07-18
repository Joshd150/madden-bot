import { ParameterizedContext } from "koa";
import { APIChatInputApplicationCommandInteractionData, APIInteractionGuildMember } from "discord-api-types/payloads";
import { APIAutocompleteApplicationCommandInteractionData, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import { DiscordClient, CommandMode } from "./discord_utils";
import { Firestore } from "firebase-admin/firestore";
import { APIMessageComponentInteractionData } from "discord-api-types/v9";
export type Command = {
    command_name: string;
    token: string;
    guild_id: string;
    data: APIChatInputApplicationCommandInteractionData;
    member: APIInteractionGuildMember;
};
export type Autocomplete = {
    command_name: string;
    guild_id: string;
    data: APIAutocompleteApplicationCommandInteractionData;
};
export type MessageComponentInteraction = {
    custom_id: string;
    token: string;
    data: APIMessageComponentInteractionData;
    guild_id: string;
};
export interface CommandHandler {
    handleCommand(command: Command, client: DiscordClient, db: Firestore, ctx: ParameterizedContext): Promise<void>;
    commandDefinition(): RESTPostAPIApplicationCommandsJSONBody;
}
export interface AutocompleteHandler {
    choices(query: Autocomplete): Promise<{
        name: string;
        value: string;
    }[]>;
}
export interface MessageComponentHandler {
    handleInteraction(interaction: MessageComponentInteraction, client: DiscordClient): Promise<void>;
}
export type CommandsHandler = {
    [key: string]: CommandHandler | undefined;
};
export type AutocompleteHandlers = Record<string, AutocompleteHandler>;
export type MessageComponentHandlers = Record<string, MessageComponentHandler>;
export declare function handleCommand(command: Command, ctx: ParameterizedContext, discordClient: DiscordClient, db: Firestore): Promise<void>;
export declare function handleAutocomplete(command: Autocomplete, ctx: ParameterizedContext): Promise<void>;
export declare function handleMessageComponent(interaction: MessageComponentInteraction, ctx: ParameterizedContext, client: DiscordClient): Promise<void>;
export declare function commandsInstaller(client: DiscordClient, commandNames: string[], mode: CommandMode, guildId?: string): Promise<void>;
//# sourceMappingURL=commands_handler.d.ts.map