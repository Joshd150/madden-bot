"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const madden_db_1 = __importDefault(require("../db/madden_db"));
const game_channels_1 = require("../discord/commands/game_channels");
const discord_utils_1 = require("../discord/discord_utils");
const events_db_1 = __importDefault(require("../db/events_db"));
const firebase_1 = __importDefault(require("../db/firebase"));
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
async function updateScoreboard(guildId, seasonIndex, week) {
    const doc = await firebase_1.default.collection("league_settings").doc(guildId).get();
    const leagueSettings = doc.exists ? doc.data() : {};
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
    const teams = await madden_db_1.default.getLatestTeams(leagueId);
    const games = await madden_db_1.default.getWeekScheduleForSeason(leagueId, week, seasonIndex);
    const sims = await events_db_1.default.queryEvents(guildId, "CONFIRMED_SIM", new Date(0), { week: week, seasonIndex: seasonIndex }, 30);
    const message = (0, game_channels_1.formatScoreboard)(week, seasonIndex, games, teams, sims, leagueId);
    await prodClient.editMessage(scoreboard_channel, scoreboard, message, []);
}
updateScoreboard("1296207094344843264", 1, 12);
//# sourceMappingURL=force_scoreboard.js.map