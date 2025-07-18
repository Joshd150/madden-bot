"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.PUBLIC_KEY = "e6a1b0559decf576d01c5700e56feec05a4c917e24ef3db1d0c152173e50ffc1";
process.env.DISCORD_TOKEN = "MTM5NDcwMTEyMDA5NzYyMDExMg.G7z1U3.8flml87HyEqK9tQz8JwD-2bAiSz69gIkhZUGps";
process.env.APP_ID = "1394701120097620112";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.DEPLOYMENT_URL = "36a3e451ce78.ngrok-free.app";
const router_1 = __importDefault(require("@koa/router"));
const discord_utils_1 = require("./discord_utils");
const payloads_1 = require("discord-api-types/payloads");
const firebase_1 = __importDefault(require("../db/firebase"));
const events_db_1 = __importDefault(require("../db/events_db"));
const commands_handler_1 = require("./commands_handler");
const oceanic_js_1 = require("oceanic.js");
const settings_db_1 = require("./settings_db");
const firestore_1 = require("firebase-admin/firestore");
const teams_1 = require("./commands/teams");
const notifier_1 = __importDefault(require("./notifier"));
const madden_db_1 = __importDefault(require("../db/madden_db"));
const game_channels_1 = require("./commands/game_channels");
const madden_db_2 = __importDefault(require("../db/madden_db"));
const madden_league_types_1 = require("../export/madden_league_types");
const router = new router_1.default({ prefix: "/discord/webhook" });
if (!process.env.PUBLIC_KEY) {
    throw new Error("No Public Key passed for interaction verification");
}
if (!process.env.DISCORD_TOKEN) {
    throw new Error("No Discord Token passed for interaction verification");
}
if (!process.env.APP_ID) {
    throw new Error("No App Id passed for interaction verification");
}
const prodSettings = { publicKey: process.env.PUBLIC_KEY, botToken: process.env.DISCORD_TOKEN, appId: process.env.APP_ID };
const prodClient = (0, discord_utils_1.createClient)(prodSettings);
async function handleInteraction(ctx, client) {
    const verified = await client.interactionVerifier(ctx);
    if (!verified) {
        ctx.status = 401;
        return;
    }
    const interaction = ctx.request.body;
    const { type: interactionType } = interaction;
    if (interactionType === payloads_1.InteractionType.Ping) {
        ctx.status = 200;
        ctx.body = { type: payloads_1.InteractionResponseType.Pong };
        return;
    }
    if (interactionType === payloads_1.InteractionType.ApplicationCommand) {
        const slashCommandInteraction = interaction;
        const { token, guild_id, data, member } = slashCommandInteraction;
        const { name } = data;
        await (0, commands_handler_1.handleCommand)({ command_name: name, token, guild_id, data, member }, ctx, client, firebase_1.default);
        return;
    }
    else if (interactionType === payloads_1.InteractionType.ApplicationCommandAutocomplete) {
        const slashCommandInteraction = interaction;
        const { guild_id, data } = slashCommandInteraction;
        if (guild_id) {
            const { name } = data;
            await (0, commands_handler_1.handleAutocomplete)({ command_name: name, guild_id, data, }, ctx);
        }
        return;
    }
    else if (interactionType === payloads_1.InteractionType.MessageComponent) {
        const messageComponentInteraction = interaction;
        if (messageComponentInteraction.guild_id) {
            await (0, commands_handler_1.handleMessageComponent)({ token: messageComponentInteraction.token, custom_id: messageComponentInteraction.data.custom_id, data: messageComponentInteraction.data, guild_id: messageComponentInteraction.guild_id }, ctx, client);
        }
        return;
    }
    // anything else fail the command
    ctx.status = 404;
}
router.post("/slashCommand", async (ctx) => {
    await handleInteraction(ctx, prodClient);
}).post("/commandsHandler", async (ctx) => {
    const req = ctx.request.body;
    await (0, commands_handler_1.commandsInstaller)(prodClient, req.commandNames || [], req.mode, req.guildId);
    ctx.status = 200;
});
events_db_1.default.on("MADDEN_BROADCAST", async (events) => {
    events.map(async (broadcastEvent) => {
        const discordServer = broadcastEvent.key;
        const doc = await firebase_1.default.collection("league_settings").doc(discordServer).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        const configuration = leagueSettings.commands?.broadcast;
        if (!configuration) {
            console.error(`${discordServer} is not configured for Broadcasts`);
        }
        else {
            const channel = configuration.channel;
            const role = configuration.role ? `<@&${configuration.role.id}>` : "";
            try {
                prodClient.createMessage(channel, `${role} ${broadcastEvent.title}\n\n${broadcastEvent.video}`, ["roles"]);
            }
            catch (e) {
                console.error("could not send broacast");
            }
        }
    });
});
async function updateScoreboard(leagueSettings, guildId, seasonIndex, week) {
    const leagueId = leagueSettings.commands.madden_league?.league_id;
    if (!leagueId) {
        return;
    }
    const weekState = leagueSettings.commands.game_channel?.weekly_states?.[(0, discord_utils_1.createWeekKey)(seasonIndex, week)];
    const scoreboard_channel = leagueSettings.commands.game_channel?.scoreboard_channel;
    if (!scoreboard_channel) {
        return;
    }
    const scoreboard = weekState?.scoreboard;
    if (!scoreboard) {
        return;
    }
    try {
        const teams = await madden_db_1.default.getLatestTeams(leagueId);
        const games = await madden_db_1.default.getWeekScheduleForSeason(leagueId, week, seasonIndex);
        const sims = await events_db_1.default.queryEvents(guildId, "CONFIRMED_SIM", new Date(0), { week: week, seasonIndex: seasonIndex }, 30);
        const message = (0, game_channels_1.formatScoreboard)(week, seasonIndex, games, teams, sims, leagueId);
        await prodClient.editMessage(scoreboard_channel, scoreboard, message, []);
    }
    catch (e) {
    }
}
events_db_1.default.on("CONFIRMED_SIM", async (events) => {
    await Promise.all(events.map(async (sim) => {
        const guild_id = sim.key;
        const doc = await firebase_1.default.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        await updateScoreboard(leagueSettings, guild_id, sim.seasonIndex, sim.week);
    }));
});
madden_db_2.default.on("MADDEN_SCHEDULE", async (events) => {
    Object.entries(Object.groupBy(events, e => e.key)).map(async (entry) => {
        const [leagueId, groupedGames] = entry;
        const games = groupedGames || [];
        const finishedGames = games.filter(g => g.status !== madden_league_types_1.GameResult.NOT_PLAYED);
        const finishedGame = finishedGames[0];
        const querySnapshot = await firebase_1.default.collection("league_settings").where("commands.madden_league.league_id", "==", leagueId).get();
        await Promise.all(querySnapshot.docs.map(async (leagueSettingsDoc) => {
            const settings = leagueSettingsDoc.data();
            const guild_id = leagueSettingsDoc.id;
            if (finishedGame) {
                const season = finishedGame.seasonIndex;
                const week = finishedGame.weekIndex + 1;
                await updateScoreboard(settings, guild_id, season, week);
                const notifier = (0, notifier_1.default)(prodClient, guild_id, settings);
                const gameIds = new Set(finishedGames.map(g => g.scheduleId));
                await Promise.all(Object.values(settings.commands.game_channel?.weekly_states?.[(0, discord_utils_1.createWeekKey)(season, week)]?.channel_states || {}).map(async (channelState) => {
                    if (gameIds.has(channelState.scheduleId)) {
                        try {
                            await notifier.deleteGameChannel(channelState, season, week, [{ id: discord_utils_1.SNALLABOT_USER, id_type: settings_db_1.DiscordIdType.USER }]);
                        }
                        catch (e) {
                        }
                    }
                }));
            }
        }));
    });
});
const discordClient = new oceanic_js_1.Client({
    auth: `Bot ${process.env.DISCORD_TOKEN}`,
    gateway: {
        intents: ["GUILD_MESSAGE_REACTIONS", "GUILD_MEMBERS"]
    }
});
discordClient.on("ready", () => console.log("Ready as", discordClient.user.tag));
discordClient.on("error", (error) => {
    console.error("Something went wrong:", error);
});
discordClient.on("guildMemberRemove", async (user, guild) => {
    const guildId = guild.id;
    const doc = await firebase_1.default.collection("league_settings").doc(guildId).get();
    if (!doc.exists) {
        return;
    }
    const leagueSettings = doc.data();
    if (leagueSettings.commands.teams) {
        const assignments = leagueSettings.commands.teams?.assignments || {};
        await Promise.all(Object.entries(assignments).map(async (entry) => {
            const [teamId, assignment] = entry;
            if (assignment.discord_user?.id === user.id) {
                await firebase_1.default.collection("league_settings").doc(guildId).update({
                    [`commands.teams.assignments.${teamId}.discord_user`]: firestore_1.FieldValue.delete()
                });
                delete assignments[teamId].discord_user;
            }
        }));
        const message = await (0, teams_1.fetchTeamsMessage)(leagueSettings);
        try {
            await prodClient.editMessage(leagueSettings.commands.teams.channel, leagueSettings.commands.teams.messageId, message, []);
        }
        catch (e) {
        }
    }
});
discordClient.on("guildMemberUpdate", async (member, old) => {
    const guildId = member.guildID;
    const doc = await firebase_1.default.collection("league_settings").doc(guildId).get();
    if (!doc.exists) {
        return;
    }
    const leagueSettings = doc.data();
    if (leagueSettings.commands.teams?.useRoleUpdates) {
        const users = await prodClient.getUsers(guildId);
        const userWithRoles = users.map((u) => ({ id: u.user.id, roles: u.roles }));
        const assignments = leagueSettings.commands.teams.assignments || {};
        await Promise.all(Object.entries(assignments).map(async (entry) => {
            const [teamId, assignment] = entry;
            if (assignment.discord_role?.id) {
                const userInTeam = userWithRoles.filter(u => u.roles.includes(assignment.discord_role?.id || ""));
                if (userInTeam.length === 0) {
                    await firebase_1.default.collection("league_settings").doc(guildId).update({
                        [`commands.teams.assignments.${teamId}.discord_user`]: firestore_1.FieldValue.delete()
                    });
                    delete assignments[teamId].discord_user;
                }
                else if (userInTeam.length === 1) {
                    await firebase_1.default.collection("league_settings").doc(guildId).update({
                        [`commands.teams.assignments.${teamId}.discord_user`]: { id: userInTeam[0].id, id_type: settings_db_1.DiscordIdType.USER }
                    });
                    assignments[teamId].discord_user = { id: userInTeam[0].id, id_type: settings_db_1.DiscordIdType.USER };
                }
                else {
                }
            }
        }));
        const message = await (0, teams_1.fetchTeamsMessage)(leagueSettings);
        try {
            await prodClient.editMessage(leagueSettings.commands.teams.channel, leagueSettings.commands.teams.messageId, message, []);
        }
        catch (e) {
        }
    }
});
const validReactions = ["🏆", "⏭️"];
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
discordClient.on("messageReactionAdd", async (msg, reactor, reaction) => {
    // don't respond when bots react!
    if (reactor.id === discord_utils_1.SNALLABOT_USER || reactor.id === discord_utils_1.SNALLABOT_TEST_USER) {
        return;
    }
    const guild = msg.guildID;
    if (!guild) {
        return;
    }
    if (!validReactions.includes(reaction.emoji.name)) {
        return;
    }
    const reactionChannel = msg.channelID;
    const reactionMessage = msg.id;
    const doc = await firebase_1.default.collection("league_settings").doc(guild).get();
    if (!doc.exists) {
        return;
    }
    const leagueSettings = doc.data();
    const weeklyStates = leagueSettings.commands?.game_channel?.weekly_states || {};
    await Promise.all(Object.values(weeklyStates).map(async (weeklyState) => {
        await Promise.all(Object.entries(weeklyState.channel_states).map(async (channelEntry) => {
            const [channelId, channelState] = channelEntry;
            if (channelId === reactionChannel && channelState?.message?.id === reactionMessage) {
                const notifier = (0, notifier_1.default)(prodClient, guild, leagueSettings);
                // wait for users to confirm/unconfirm
                const jitter = getRandomInt(10);
                await new Promise((r) => setTimeout(r, 5000 + jitter * 1000));
                try {
                    await notifier.update(channelState, weeklyState.seasonIndex, weeklyState.week);
                }
                catch (e) {
                }
            }
        }));
    }));
});
if (process.env.APP_ID !== discord_utils_1.SNALLABOT_TEST_USER) {
    discordClient.connect();
}
exports.default = router;
//# sourceMappingURL=routes.js.map