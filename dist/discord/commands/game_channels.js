"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatScoreboard = void 0;
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const settings_db_1 = require("../settings_db");
const madden_db_1 = __importDefault(require("../../db/madden_db"));
const madden_league_types_1 = require("../../export/madden_league_types");
const logging_1 = __importDefault(require("../logging"));
const events_1 = require("../../db/events");
const notifier_1 = __importDefault(require("../notifier"));
const ea_client_1 = require("../../dashboard/ea_client");
const routes_1 = require("../../dashboard/routes");
async function react(client, channel, message, reaction) {
    await client.reactToMessage(`${reaction}`, message, channel);
}
function notifierMessage(users, waitPing, role) {
    return (`**${users}**\n\n` +
        `:alarm_clock: **Time to schedule your game!**\n` +
        `Once your game is scheduled, hit the ⏰. Otherwise, you will be notified again every **${waitPing} hours**.\n\n` +
        `When you're done playing, let me know with 🏆 and I will delete the channel.\n` +
        `Need to sim this game? React with ⏭ **AND** select home/away to request a force win from <@&${role.id}>. Choose both home and away for a fair sim! <@&${role.id}> hit ⏭ to confirm!\n`);
}
function createSimMessage(sim) {
    if (sim.result === events_1.SimResult.FAIR_SIM)
        return "Fair Sim";
    if (sim.result === events_1.SimResult.FORCE_WIN_AWAY)
        return "Force Win Away";
    if (sim.result === events_1.SimResult.FORCE_WIN_HOME)
        return "Force Win Home";
    throw new Error("Should not have gotten here! from createSimMessage");
}
function formatScoreboard(week, seasonIndex, games, teams, sims, leagueId) {
    const gameToSim = new Map();
    sims.filter(s => s.leagueId ? s.leagueId === leagueId : true).forEach(sim => gameToSim.set(sim.scheduleId, sim));
    const scoreboardGames = games
        .sort((g1, g2) => g1.scheduleId - g2.scheduleId)
        .map(game => {
        const simMessage = gameToSim.has(game.scheduleId) ? ` (${createSimMessage(gameToSim.get(game.scheduleId))})` : "";
        const awayTeamName = teams.getTeamForId(game.awayTeamId)?.displayName;
        const homeTeamName = teams.getTeamForId(game.homeTeamId)?.displayName;
        // Unplayed
        if (game.awayScore == 0 && game.homeScore == 0) {
            return `• ${awayTeamName} vs ${homeTeamName}${simMessage}`;
        }
        // Away win
        if (game.awayScore > game.homeScore) {
            return `• **${awayTeamName} ${game.awayScore}** vs ${game.homeScore} ${homeTeamName}${simMessage}`;
        }
        // Home win
        if (game.homeScore > game.awayScore) {
            return `• ${awayTeamName} ${game.awayScore} vs **${game.homeScore} ${homeTeamName}**${simMessage}`;
        }
        // Tie
        return `• ${awayTeamName} ${game.awayScore} vs ${game.homeScore} ${homeTeamName}${simMessage}`;
    })
        .join("\n");
    return `## ${seasonIndex + 2024} Season – ${(0, madden_league_types_1.getMessageForWeek)(week)} Scoreboard\n${scoreboardGames}`;
}
exports.formatScoreboard = formatScoreboard;
var SnallabotCommandReactions;
(function (SnallabotCommandReactions) {
    SnallabotCommandReactions["LOADING"] = "<:vfl_loading:1394857937037561926>";
    SnallabotCommandReactions["WAITING"] = "<:vfl_waiting:1394858023863713823>";
    SnallabotCommandReactions["FINISHED"] = "<:vfl_done:1394857797790859446>";
    SnallabotCommandReactions["ERROR"] = "<:vfl_error:1394857619700580453>";
})(SnallabotCommandReactions || (SnallabotCommandReactions = {}));
async function createGameChannels(client, db, token, guild_id, settings, week, category, author) {
    try {
        const leagueId = settings.commands.madden_league.league_id;
        await client.editOriginalInteraction(token, {
            content: `# Creating Game Channels...\n` +
                `- ${SnallabotCommandReactions.LOADING} **Exporting**\n` +
                `- ${SnallabotCommandReactions.WAITING} Creating Channels\n` +
                `- ${SnallabotCommandReactions.WAITING} Creating Notification Messages\n` +
                `- ${SnallabotCommandReactions.WAITING} Setting up Notifier\n` +
                `- ${SnallabotCommandReactions.WAITING} Creating Scoreboard\n` +
                `- ${SnallabotCommandReactions.WAITING} Logging`
        });
        let exportEmoji = SnallabotCommandReactions.FINISHED;
        let errorMessage = "";
        try {
            const exporter = await (0, ea_client_1.exporterForLeague)(Number(leagueId), ea_client_1.ExportContext.AUTO);
            await exporter.exportSurroundingWeek();
        }
        catch (e) {
            exportEmoji = SnallabotCommandReactions.ERROR;
            if (e instanceof routes_1.EAAccountError) {
                errorMessage = `> **Export Failed:** EA Error ${e.message}\n> Guidance: ${e.troubleshoot}`;
            }
            else {
                errorMessage = `> **Export Failed:** ${e}`;
            }
        }
        await client.editOriginalInteraction(token, {
            content: `# Creating Game Channels...\n` +
                `- ${exportEmoji} **Exporting**\n` +
                `- ${SnallabotCommandReactions.LOADING} Creating Channels\n` +
                `- ${SnallabotCommandReactions.WAITING} Creating Notification Messages\n` +
                `- ${SnallabotCommandReactions.WAITING} Setting up Notifier\n` +
                `- ${SnallabotCommandReactions.WAITING} Creating Scoreboard\n` +
                `- ${SnallabotCommandReactions.WAITING} Logging`
        });
        let weekSchedule;
        try {
            weekSchedule = (await madden_db_1.default.getLatestWeekSchedule(leagueId, week)).sort((g, g2) => g.scheduleId - g2.scheduleId);
        }
        catch (e) {
            await client.editOriginalInteraction(token, {
                content: `# Creating Game Channels...\n` +
                    `- ${exportEmoji} **Exporting**\n` +
                    `- ${SnallabotCommandReactions.LOADING} Creating Channels (Auto-retrieving the week – please wait...)\n` +
                    `- ${SnallabotCommandReactions.WAITING} Creating Notification Messages\n` +
                    `- ${SnallabotCommandReactions.WAITING} Setting up Notifier\n` +
                    `- ${SnallabotCommandReactions.WAITING} Creating Scoreboard\n` +
                    `- ${SnallabotCommandReactions.WAITING} Logging`
            });
            try {
                const exporter = await (0, ea_client_1.exporterForLeague)(Number(leagueId), ea_client_1.ExportContext.AUTO);
                await exporter.exportSpecificWeeks([{ weekIndex: week, stage: ea_client_1.Stage.SEASON }]);
                weekSchedule = (await madden_db_1.default.getLatestWeekSchedule(leagueId, week)).sort((g, g2) => g.scheduleId - g2.scheduleId);
            }
            catch (e) {
                await client.editOriginalInteraction(token, { content: "**This week is not exported!**\nExport it via dashboard or companion app." });
                return;
            }
        }
        const teams = await madden_db_1.default.getLatestTeams(leagueId);
        const gameChannels = await Promise.all(weekSchedule.map(async (game) => {
            const awayTeam = teams.getTeamForId(game.awayTeamId)?.displayName;
            const homeTeam = teams.getTeamForId(game.homeTeamId)?.displayName;
            const channel = await client.createChannel(guild_id, `${awayTeam}-at-${homeTeam}`, category);
            return { game: game, scheduleId: game.scheduleId, channel: channel };
        }));
        await client.editOriginalInteraction(token, {
            content: `# Creating Game Channels...\n` +
                `- ${exportEmoji} **Exporting**\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Channels\n` +
                `- ${SnallabotCommandReactions.LOADING} Creating Notification Messages\n` +
                `- ${SnallabotCommandReactions.WAITING} Setting up Notifier\n` +
                `- ${SnallabotCommandReactions.WAITING} Creating Scoreboard\n` +
                `- ${SnallabotCommandReactions.WAITING} Logging`
        });
        const assignments = teams.getLatestTeamAssignments(settings.commands.teams?.assignments || {});
        if (!settings.commands.game_channel)
            return;
        const waitPing = settings.commands.game_channel.wait_ping || 12;
        const role = settings.commands.game_channel.admin;
        const gameChannelsWithMessage = await Promise.all(gameChannels.map(async (gameChannel) => {
            const channel = gameChannel.channel;
            const game = gameChannel.game;
            const awayTeamId = teams.getTeamForId(game.awayTeamId).teamId;
            const homeTeamId = teams.getTeamForId(game.homeTeamId).teamId;
            const awayUser = (0, discord_utils_1.formatTeamMessageName)(assignments?.[awayTeamId]?.discord_user?.id, teams.getTeamForId(game.awayTeamId)?.userName);
            const homeUser = (0, discord_utils_1.formatTeamMessageName)(assignments?.[game.homeTeamId]?.discord_user?.id, teams.getTeamForId(game.homeTeamId)?.userName);
            const awayTeamStanding = await madden_db_1.default.getStandingForTeam(leagueId, awayTeamId);
            const homeTeamStanding = await madden_db_1.default.getStandingForTeam(leagueId, homeTeamId);
            const usersMessage = `${awayUser} (${(0, madden_league_types_1.formatRecord)(awayTeamStanding)}) at ${homeUser} (${(0, madden_league_types_1.formatRecord)(homeTeamStanding)})`;
            const message = await client.createMessage(channel, notifierMessage(usersMessage, waitPing, role), ["users"]);
            return { message: message, ...gameChannel };
        }));
        await client.editOriginalInteraction(token, {
            content: `# Creating Game Channels...\n` +
                `- ${exportEmoji} **Exporting**\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Channels\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Notification Messages\n` +
                `- ${SnallabotCommandReactions.LOADING} Setting up Notifier\n` +
                `- ${SnallabotCommandReactions.WAITING} Creating Scoreboard\n` +
                `- ${SnallabotCommandReactions.WAITING} Logging`
        });
        const finalGameChannels = await Promise.all(gameChannelsWithMessage.map(async (gameChannel) => {
            const { channel: channel, message: message } = gameChannel;
            await react(client, channel, message, discord_utils_1.SnallabotReactions.SCHEDULE);
            await react(client, channel, message, discord_utils_1.SnallabotReactions.GG);
            await react(client, channel, message, discord_utils_1.SnallabotReactions.HOME);
            await react(client, channel, message, discord_utils_1.SnallabotReactions.AWAY);
            await react(client, channel, message, discord_utils_1.SnallabotReactions.SIM);
            const { game, ...rest } = gameChannel;
            const createdTime = new Date().getTime();
            return { ...rest, state: settings_db_1.GameChannelState.CREATED, notifiedTime: createdTime, channel: channel, message: message };
        }));
        const channelsMap = {};
        finalGameChannels.forEach(g => channelsMap[g.channel.id] = g);
        await client.editOriginalInteraction(token, {
            content: `# Creating Game Channels...\n` +
                `- ${exportEmoji} **Exporting**\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Channels\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Notification Messages\n` +
                `- ${SnallabotCommandReactions.FINISHED} Setting up Notifier\n` +
                `- ${SnallabotCommandReactions.LOADING} Creating Scoreboard\n` +
                `- ${SnallabotCommandReactions.WAITING} Logging`
        });
        const season = weekSchedule[0].seasonIndex;
        const scoreboardMessage = formatScoreboard(week, season, weekSchedule, teams, [], leagueId);
        const scoreboardMessageId = await client.createMessage(settings.commands.game_channel?.scoreboard_channel, scoreboardMessage, []);
        const weeklyState = { week: week, seasonIndex: season, scoreboard: scoreboardMessageId, channel_states: channelsMap };
        const weekKey = (0, discord_utils_1.createWeekKey)(season, week);
        await client.editOriginalInteraction(token, {
            content: `# Creating Game Channels...\n` +
                `- ${exportEmoji} **Exporting**\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Channels\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Notification Messages\n` +
                `- ${SnallabotCommandReactions.FINISHED} Setting up Notifier\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Scoreboard\n` +
                `- ${SnallabotCommandReactions.LOADING} Logging`
        });
        if (settings?.commands?.logger) {
            const logger = (0, logging_1.default)(settings.commands.logger);
            await logger.logUsedCommand("game_channels create", author, client);
        }
        await client.editOriginalInteraction(token, {
            content: `## :white_check_mark: **Game Channels Successfully Created**\n` +
                `- ${exportEmoji} Exporting\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Channels\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Notification Messages\n` +
                `- ${SnallabotCommandReactions.FINISHED} Setting up Notifier\n` +
                `- ${SnallabotCommandReactions.FINISHED} Creating Scoreboard\n` +
                `- ${SnallabotCommandReactions.FINISHED} Logging\n` +
                (errorMessage ? `\n${errorMessage}\n` : "")
        });
        await db.collection("league_settings").doc(guild_id).update({
            [`commands.game_channel.weekly_states.${weekKey}`]: weeklyState
        });
    }
    catch (e) {
        if (e instanceof discord_utils_1.SnallabotDiscordError) {
            await client.editOriginalInteraction(token, {
                content: `:x: **Game Channels Create Failed!**\n> Error: ${e}\n> Guidance: ${e.guidance}`
            });
        }
        else {
            await client.editOriginalInteraction(token, {
                content: `:x: **Game Channels Create Failed!**\n> Error: ${e}`
            });
        }
    }
}
async function clearGameChannels(client, db, token, guild_id, settings, author) {
    try {
        await client.editOriginalInteraction(token, { content: ":wastebasket: **Clearing Game Channels...**" });
        const weekStates = settings.commands.game_channel?.weekly_states || {};
        const channelsToClear = Object.entries(weekStates).flatMap(entry => {
            const weekState = entry[1];
            return Object.values(weekState.channel_states);
        }).map(channelStates => {
            return channelStates.channel;
        });
        await Promise.all(Object.keys(weekStates).map(async (weekKey) => {
            db.collection("league_settings").doc(guild_id).update({
                [`commands.game_channel.weekly_states.${weekKey}.channel_states`]: []
            });
        }));
        if (settings.commands.logger?.channel) {
            await client.editOriginalInteraction(token, { content: ":bookmark_tabs: **Logging Game Channels...**" });
            const logger = (0, logging_1.default)(settings.commands.logger);
            await logger.logChannels(channelsToClear, [author], client);
            await logger.logUsedCommand("game_channels clear", author, client);
        }
        else {
            await Promise.all(channelsToClear.map(async (channel) => {
                try {
                    await client.deleteChannel(channel);
                }
                catch (e) {
                    if (e instanceof discord_utils_1.SnallabotDiscordError && e.isDeletedChannel()) {
                        return;
                    }
                    throw e;
                }
                return await client.deleteChannel(channel);
            }));
        }
        await client.editOriginalInteraction(token, { content: ":white_check_mark: **Game Channels Cleared**" });
    }
    catch (e) {
        await client.editOriginalInteraction(token, { content: ":warning: **Game Channels could not be cleared properly.**\nIf all game channels are deleted, this is safe to ignore. If you still have game channels, delete them manually.\n> Error: " + e });
    }
}
async function notifyGameChannels(client, token, guild_id, settings) {
    try {
        await client.editOriginalInteraction(token, { content: ":bell: **Notifying Game Channels...**" });
        const weekStates = settings.commands.game_channel?.weekly_states || {};
        const notifier = (0, notifier_1.default)(client, guild_id, settings);
        await Promise.all(Object.entries(weekStates).map(async (entry) => {
            const weekState = entry[1];
            const season = weekState.seasonIndex;
            const week = weekState.week;
            return await Promise.all(Object.values(weekState.channel_states).map(async (channel) => {
                await notifier.ping(channel, season, week);
            }));
        }));
        await client.editOriginalInteraction(token, { content: ":white_check_mark: **Game Channels Notified**" });
    }
    catch (e) {
        await client.editOriginalInteraction(token, { content: ":warning: **Game Channels could not be notified properly**\n> Error: " + e });
    }
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id, token, member } = command;
        const author = { id: member.user.id, id_type: settings_db_1.DiscordIdType.USER };
        if (!command.data.options) {
            throw new Error("game channels command not defined properly");
        }
        const options = command.data.options;
        const gameChannelsCommand = options[0];
        const subCommand = gameChannelsCommand.name;
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (subCommand === "configure") {
            if (!gameChannelsCommand.options ||
                !gameChannelsCommand.options[0] ||
                !gameChannelsCommand.options[1] ||
                !gameChannelsCommand.options[2] ||
                !gameChannelsCommand.options[3]) {
                throw new Error("game_channels configure command misconfigured");
            }
            const gameChannelCategory = gameChannelsCommand.options[0].value;
            const scoreboardChannel = gameChannelsCommand.options[1].value;
            const waitPing = gameChannelsCommand.options[2].value;
            const adminRole = gameChannelsCommand.options[3].value;
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`# :gear: Game Channels Configured!\n` +
                `• **Admin Role:** <@&${adminRole}>\n` +
                `• **Game Channel Category:** <#${gameChannelCategory}>\n` +
                `• **Scoreboard Channel:** <#${scoreboardChannel}>\n` +
                `• **Notification Period:** Every **${waitPing} hour(s)**`));
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    game_channel: {
                        admin: { id: adminRole, id_type: settings_db_1.DiscordIdType.ROLE },
                        default_category: { id: gameChannelCategory, id_type: settings_db_1.DiscordIdType.CATEGORY },
                        scoreboard_channel: { id: scoreboardChannel, id_type: settings_db_1.DiscordIdType.CHANNEL },
                        wait_ping: waitPing,
                        weekly_states: leagueSettings?.commands?.game_channel?.weekly_states || {}
                    }
                }
            }, { merge: true });
        }
        else if (subCommand === "create" ||
            subCommand === "wildcard" ||
            subCommand === "divisional" ||
            subCommand === "conference" ||
            subCommand === "superbowl") {
            const week = (() => {
                if (subCommand === "create") {
                    if (!gameChannelsCommand.options || !gameChannelsCommand.options[0]) {
                        throw new Error("game_channels create command misconfigured");
                    }
                    const week = Number(gameChannelsCommand.options[0].value);
                    if (week < 1 || week > 23 || week === 22) {
                        throw new Error("Invalid week number. Valid weeks are week 1-18 and use specific playoff commands or playoff week numbers: Wildcard = 19, Divisional = 20, Conference Championship = 21, Super Bowl = 23");
                    }
                    return week;
                }
                if (subCommand === "wildcard")
                    return 19;
                if (subCommand === "divisional")
                    return 20;
                if (subCommand === "conference")
                    return 21;
                if (subCommand === "superbowl")
                    return 23;
            })();
            if (!week)
                throw new Error("Invalid Week found " + week);
            const categoryOverride = (() => {
                if (subCommand === "create") {
                    return gameChannelsCommand.options?.[1]?.value;
                }
                else {
                    return gameChannelsCommand.options?.[0]?.value;
                }
            })();
            if (!leagueSettings.commands?.game_channel?.scoreboard_channel) {
                throw new Error("Game channels are not configured! Run `/game_channels configure` first.");
            }
            if (!leagueSettings.commands?.madden_league?.league_id) {
                throw new Error("No Madden league linked. Setup Snallabot with your Madden league first.");
            }
            const category = categoryOverride ? categoryOverride : leagueSettings.commands.game_channel.default_category.id;
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
            createGameChannels(client, db, token, guild_id, leagueSettings, week, { id: category, id_type: settings_db_1.DiscordIdType.CATEGORY }, author);
        }
        else if (subCommand === "clear") {
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
            clearGameChannels(client, db, token, guild_id, leagueSettings, author);
        }
        else if (subCommand === "notify") {
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
            notifyGameChannels(client, token, guild_id, leagueSettings);
        }
        else {
            throw new Error(`game_channels ${subCommand} not implemented`);
        }
    },
    commandDefinition() {
        return {
            name: "game_channels",
            description: "handles Snallabot game channels",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "create",
                    description: "create game channels",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "week",
                            description: "the week number to create for",
                            required: true,
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "category_override",
                            description: "overrides the category to create channels in",
                            channel_types: [v10_1.ChannelType.GuildCategory],
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "wildcard",
                    description: "creates wildcard week game channels",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "category_override",
                            description: "overrides the category to create channels in",
                            channel_types: [v10_1.ChannelType.GuildCategory],
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "divisional",
                    description: "creates divisional week game channels",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "category_override",
                            description: "overrides the category to create channels in",
                            channel_types: [v10_1.ChannelType.GuildCategory],
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "conference",
                    description: "creates conference championship week game channels",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "category_override",
                            description: "overrides the category to create channels in",
                            channel_types: [v10_1.ChannelType.GuildCategory],
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "superbowl",
                    description: "creates superbowl week game channels",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "category_override",
                            description: "overrides the category to create channels in",
                            channel_types: [v10_1.ChannelType.GuildCategory],
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "clear",
                    description: "clear all game channels",
                    options: []
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "sets up game channels",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "category",
                            description: "category to create channels under",
                            required: true,
                            channel_types: [v10_1.ChannelType.GuildCategory],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "scoreboard_channel",
                            description: "channel to post scoreboard",
                            required: true,
                            channel_types: [0],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "notification_period",
                            description: "number of hours to wait before notifying unscheduled games",
                            required: true,
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Role,
                            name: "admin_role",
                            description: "admin role to confirm force wins",
                            required: true,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "notify",
                    description: "notifies all remaining game channels",
                    options: []
                },
            ]
        };
    }
};
//# sourceMappingURL=game_channels.js.map