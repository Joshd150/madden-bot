"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = __importDefault(require("../db/firebase"));
const discord_utils_1 = require("./discord_utils");
const notifier_1 = __importDefault(require("./notifier"));
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
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
async function updateEachLeagueNotifier() {
    const querySnapshot = await firebase_1.default.collection("league_settings").get();
    for (const leagueSettingsDoc of querySnapshot.docs) {
        const leagueSettings = leagueSettingsDoc.data();
        try {
            const notifier = (0, notifier_1.default)(prodClient, leagueSettingsDoc.id, leagueSettings);
            const weeklyStates = leagueSettings.commands?.game_channel?.weekly_states || {};
            const jitter = getRandomInt(3);
            await new Promise((r) => setTimeout(r, 1000 + jitter * 1000));
            await Promise.all(Object.values(weeklyStates).map(async (weeklyState) => {
                await Promise.all(Object.entries(weeklyState.channel_states).map(async (channelEntry) => {
                    const [channelId, channelState] = channelEntry;
                    try {
                        await new Promise((r) => setTimeout(r, 500 + jitter * 100));
                        await notifier.update(channelState, weeklyState.seasonIndex, weeklyState.week);
                    }
                    catch (e) {
                    }
                }));
            }));
        }
        catch (e) {
            // well do nothing
        }
    }
}
updateEachLeagueNotifier();
//# sourceMappingURL=pinger.js.map