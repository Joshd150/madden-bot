"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandsInstaller = exports.handleMessageComponent = exports.handleAutocomplete = exports.handleCommand = void 0;
const v10_1 = require("discord-api-types/v10");
const discord_utils_1 = require("./discord_utils");
const league_export_1 = __importDefault(require("./commands/league_export"));
const test_1 = __importDefault(require("./commands/test"));
const dashboard_1 = __importDefault(require("./commands/dashboard"));
const logger_1 = __importDefault(require("./commands/logger"));
const waitlist_1 = __importDefault(require("./commands/waitlist"));
const broadcasts_1 = __importDefault(require("./commands/broadcasts"));
const streams_1 = __importDefault(require("./commands/streams"));
const teams_1 = __importDefault(require("./commands/teams"));
const schedule_1 = __importDefault(require("./commands/schedule"));
const game_channels_1 = __importDefault(require("./commands/game_channels"));
const export_1 = __importDefault(require("./commands/export"));
const standings_1 = __importDefault(require("./commands/standings"));
const trades_1 = __importDefault(require("../vfl/commands/trades"));
const scores_1 = __importDefault(require("../vfl/commands/scores"));
const teams_2 = __importDefault(require("../vfl/commands/teams"));
const player_1 = __importDefault(require("./commands/player"));
const channel_management_1 = __importDefault(require("./commands/channel_management"));
const advanced_stats_1 = __importDefault(require("./commands/advanced_stats"));
const SlashCommands = {
    "league_export": league_export_1.default,
    "dashboard": dashboard_1.default,
    "game_channels": game_channels_1.default,
    "teams": teams_1.default,
    "streams": streams_1.default,
    "broadcasts": broadcasts_1.default,
    "waitlist": waitlist_1.default,
    "schedule": schedule_1.default,
    "logger": logger_1.default,
    "export": export_1.default,
    "test": test_1.default,
    "standings": standings_1.default,
    "vfl-trades": trades_1.default,
    "vfl-scores": scores_1.default,
    "vfl-teams": teams_2.default,
    "player": player_1.default,
    "set-channel": channel_management_1.default,
    "advanced-stats": advanced_stats_1.default
};
const AutocompleteCommands = {
    "teams": teams_1.default,
    "player": player_1.default
};
const MessageComponents = {
    "player_card": player_1.default
};
async function handleCommand(command, ctx, discordClient, db) {
    const commandName = command.command_name;
    const handler = SlashCommands[commandName];
    if (handler) {
        try {
            await handler.handleCommand(command, discordClient, db, ctx);
        }
        catch (e) {
            const error = e;
            ctx.status = 200;
            if (error instanceof discord_utils_1.SnallabotDiscordError) {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`Discord Error in ${commandName}: ${error.message} Guidance: ${error.guidance}`));
            }
            else {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`Fatal Error in ${commandName}: ${error.message}`));
            }
        }
    }
    else {
        ctx.status = 200;
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`command ${commandName} not implemented`));
    }
}
exports.handleCommand = handleCommand;
async function handleAutocomplete(command, ctx) {
    const commandName = command.command_name;
    const handler = AutocompleteCommands[commandName];
    if (handler) {
        try {
            const choices = await handler.choices(command);
            ctx.status = 200;
            ctx.set("Content-Type", "application/json");
            ctx.body = {
                type: v10_1.InteractionResponseType.ApplicationCommandAutocompleteResult,
                data: {
                    choices: choices
                }
            };
        }
        catch (e) {
            ctx.status = 200;
            ctx.set("Content-Type", "application/json");
            ctx.body = {
                type: v10_1.InteractionResponseType.ApplicationCommandAutocompleteResult,
                data: {
                    choices: []
                }
            };
        }
    }
    else {
        ctx.status = 200;
        ctx.set("Content-Type", "application/json");
        ctx.body = {
            type: v10_1.InteractionResponseType.ApplicationCommandAutocompleteResult,
            data: {
                choices: []
            }
        };
    }
}
exports.handleAutocomplete = handleAutocomplete;
async function handleMessageComponent(interaction, ctx, client) {
    const custom_id = interaction.custom_id;
    const handler = MessageComponents[custom_id];
    if (handler) {
        try {
            await handler.handleInteraction(interaction, client);
            ctx.status = 200;
            ctx.set("Content-Type", "application/json");
            ctx.body = {
                type: v10_1.InteractionResponseType.DeferredMessageUpdate,
            };
        }
        catch (e) {
            const error = e;
            ctx.status = 500;
            console.error(error);
        }
    }
    else {
        try {
            const parsedCustomId = JSON.parse(custom_id);
            if (parsedCustomId.q) {
                await player_1.default.handleInteraction(interaction, client);
                ctx.status = 200;
                ctx.set("Content-Type", "application/json");
                ctx.body = {
                    type: v10_1.InteractionResponseType.DeferredMessageUpdate,
                };
            }
            else {
                ctx.status = 500;
            }
        }
        catch (e) {
            ctx.status = 500;
            console.error(e);
        }
    }
}
exports.handleMessageComponent = handleMessageComponent;
async function commandsInstaller(client, commandNames, mode, guildId) {
    const commandsToHandle = commandNames.length === 0 ? Object.keys(SlashCommands) : commandNames;
    await Promise.all(commandsToHandle.map(async (name) => {
        const handler = SlashCommands[name];
        if (handler) {
            await client.handleSlashCommand(mode, handler.commandDefinition(), guildId);
            console.log(`${mode} ${name}`);
        }
    }));
}
exports.commandsInstaller = commandsInstaller;
//# sourceMappingURL=commands_handler.js.map