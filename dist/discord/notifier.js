"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_db_1 = __importStar(require("../db/events_db"));
const discord_utils_1 = require("./discord_utils");
const settings_db_1 = require("./settings_db");
const logging_1 = __importDefault(require("./logging"));
const madden_db_1 = __importDefault(require("../db/madden_db"));
const firebase_1 = __importDefault(require("../db/firebase"));
const firestore_1 = require("firebase-admin/firestore");
const events_1 = require("../db/events");
const ea_client_1 = require("../dashboard/ea_client");
const madden_league_types_1 = require("../export/madden_league_types");
function decideResult(homeUsers, awayUsers) {
    if (homeUsers.length > 0 && awayUsers.length > 0) {
        return events_1.SimResult.FAIR_SIM;
    }
    if (homeUsers.length > 0) {
        return events_1.SimResult.FORCE_WIN_HOME;
    }
    if (awayUsers.length > 0) {
        return events_1.SimResult.FORCE_WIN_AWAY;
    }
    throw Error("we should not have gotten here!");
}
function joinUsers(users) {
    return users.map((uId) => `<@${uId.id}>`).join("");
}
function createNotifier(client, guildId, settings) {
    if (!settings.commands.madden_league?.league_id) {
        throw new Error("somehow channels being pinged without a league id");
    }
    const leagueId = settings.commands.madden_league.league_id;
    async function getReactedUsers(channelId, messageId, reaction) {
        try {
            return client.getUsersReacted(`${reaction}`, messageId, channelId);
        }
        catch (e) {
            throw e;
        }
    }
    async function forceWin(result, requestedUsers, confirmedUsers, gameChannel, season, week) {
        const assignments = settings.commands.teams?.assignments || {};
        const leagueId = settings.commands.madden_league?.league_id;
        if (!leagueId) {
            return;
        }
        const teams = await madden_db_1.default.getLatestTeams(leagueId);
        const latestAssignents = teams.getLatestTeamAssignments(assignments);
        const game = await madden_db_1.default.getGameForSchedule(leagueId, gameChannel.scheduleId, week, season);
        const awayTeamId = teams.getTeamForId(game.awayTeamId).teamId;
        const homeTeamId = teams.getTeamForId(game.homeTeamId).teamId;
        const awayUser = latestAssignents[awayTeamId]?.discord_user;
        const homeUser = latestAssignents[homeTeamId]?.discord_user;
        const event = { key: guildId, event_type: "CONFIRMED_SIM", result: result, scheduleId: gameChannel.scheduleId, requestedUsers: requestedUsers, confirmedUsers: confirmedUsers, week: week, seasonIndex: season, leagueId: leagueId };
        if (awayUser) {
            event.awayUser = awayUser;
        }
        if (homeUser) {
            event.homeUser = homeUser;
        }
        await events_db_1.default.appendEvents([event], events_db_1.EventDelivery.EVENT_SOURCE);
    }
    async function gameFinished(reactors, gameChannel) {
        if (settings?.commands?.logger) {
            const logger = (0, logging_1.default)(settings.commands.logger);
            await logger.logChannels([gameChannel.channel], reactors, client);
        }
        else {
            await client.deleteChannel(gameChannel.channel);
        }
    }
    async function deleteTracking(currentState, season, week) {
        const channelId = currentState.channel;
        const weekKey = (0, discord_utils_1.createWeekKey)(season, week);
        await firebase_1.default.collection("league_settings").doc(guildId).update({
            [`commands.game_channel.weekly_states.${weekKey}.channel_states.${channelId.id}`]: firestore_1.FieldValue.delete()
        });
    }
    return {
        deleteGameChannel: async function (currentState, season, week, originators) {
            await deleteTracking(currentState, season, week);
            await gameFinished(originators, currentState);
        },
        ping: async function (gameChannel, season, week) {
            const game = await madden_db_1.default.getGameForSchedule(leagueId, gameChannel.scheduleId, week, season);
            const teams = await madden_db_1.default.getLatestTeams(leagueId);
            const awayTeam = game.awayTeamId;
            const homeTeam = game.homeTeamId;
            const awayTag = (0, discord_utils_1.formatTeamMessageName)(settings.commands.teams?.assignments?.[`${awayTeam}`]?.discord_user?.id, teams.getTeamForId(awayTeam).userName);
            const homeTag = (0, discord_utils_1.formatTeamMessageName)(settings.commands.teams?.assignments?.[`${homeTeam}`]?.discord_user?.id, teams.getTeamForId(homeTeam).userName);
            const weekKey = (0, discord_utils_1.createWeekKey)(season, week);
            await firebase_1.default.collection("league_settings").doc(guildId).update({
                [`commands.game_channel.weekly_states.${weekKey}.channel_states.${gameChannel.channel.id}.notifiedTime`]: new Date().getTime()
            });
            try {
                await client.createMessage(gameChannel.channel, `${awayTag} ${homeTag} is your game scheduled? Schedule it! or react to my first message to set it as scheduled! Hit the trophy if its done already`, ["users"]);
            }
            catch (e) {
            }
        },
        update: async function (currentState, season, week) {
            const channelId = currentState.channel;
            const messageId = currentState.message;
            const messageExists = await client.checkMessageExists(channelId, messageId);
            if (!messageExists) {
                await deleteTracking(currentState, season, week);
                return;
            }
            const weekKey = (0, discord_utils_1.createWeekKey)(season, week);
            const ggUsers = await getReactedUsers(channelId, messageId, discord_utils_1.SnallabotReactions.GG);
            const scheduledUsers = await getReactedUsers(channelId, messageId, discord_utils_1.SnallabotReactions.SCHEDULE);
            const homeUsers = await getReactedUsers(channelId, messageId, discord_utils_1.SnallabotReactions.HOME);
            const awayUsers = await getReactedUsers(channelId, messageId, discord_utils_1.SnallabotReactions.AWAY);
            const fwUsers = await getReactedUsers(channelId, messageId, discord_utils_1.SnallabotReactions.SIM);
            if (ggUsers.length > 0) {
                try {
                    const exporter = await (0, ea_client_1.exporterForLeague)(Number(leagueId), ea_client_1.ExportContext.AUTO);
                    await exporter.exportCurrentWeek();
                }
                catch (e) {
                }
                try {
                    const game = await madden_db_1.default.getGameForSchedule(leagueId, currentState.scheduleId, week, season);
                    if (game.status !== madden_league_types_1.GameResult.NOT_PLAYED) {
                        await this.deleteGameChannel(currentState, season, week, ggUsers);
                    }
                }
                catch (e) {
                }
            }
            if (fwUsers.length > 0) {
                const users = await client.getUsers(guildId);
                const adminRole = settings.commands.game_channel?.admin.id || "";
                const admins = users.map((u) => ({ id: u.user.id, roles: u.roles })).filter(u => u.roles.includes(adminRole)).map(u => u.id);
                const confirmedUsers = fwUsers.filter(u => admins.includes(u.id));
                if (confirmedUsers.length >= 1) {
                    try {
                        const result = decideResult(homeUsers, awayUsers);
                        const requestedUsers = fwUsers.filter(u => !admins.includes(u.id));
                        await forceWin(result, requestedUsers, confirmedUsers, currentState, season, week);
                        await this.deleteGameChannel(currentState, season, week, requestedUsers.concat(confirmedUsers));
                    }
                    catch (e) {
                    }
                }
                else if (currentState.state !== settings_db_1.GameChannelState.FORCE_WIN_REQUESTED) {
                    const adminRole = settings.commands.game_channel?.admin.id || "";
                    const message = `Sim requested <@&${adminRole}> by ${joinUsers(fwUsers)}`;
                    await firebase_1.default.collection("league_settings").doc(guildId).update({
                        [`commands.game_channel.weekly_states.${weekKey}.channel_states.${channelId.id}.state`]: settings_db_1.GameChannelState.FORCE_WIN_REQUESTED
                    });
                    await client.createMessage(channelId, message, ["roles"]);
                }
            }
            else if (scheduledUsers.length === 0 && currentState.state !== settings_db_1.GameChannelState.FORCE_WIN_REQUESTED) {
                const waitPing = settings.commands.game_channel?.wait_ping || 12;
                const now = new Date();
                const last = new Date(currentState.notifiedTime);
                const hoursSince = (now.getTime() - last.getTime()) / 36e5;
                if (hoursSince > waitPing) {
                    await this.ping(currentState, season, week);
                }
            }
        }
    };
}
exports.default = createNotifier;
//# sourceMappingURL=notifier.js.map