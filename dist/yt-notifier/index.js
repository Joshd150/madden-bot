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
const firebase_1 = __importDefault(require("../db/firebase"));
const discord_utils_1 = require("../discord/discord_utils");
function extractTitle(html) {
    const titleTagIndex = html.indexOf('[{"videoPrimaryInfoRenderer":{"title":{"runs":[{"text":');
    const sliced = html.slice(titleTagIndex);
    const titleTag = sliced.slice(0, sliced.indexOf("}"));
    return titleTag.replace('[{"videoPrimaryInfoRenderer":{"title":{"runs":[{"text":', "").replace('}', "").replaceAll('"', "");
}
function extractVideo(html) {
    const linkTagIndex = html.indexOf('{"status":"LIKE","target":{"videoId":');
    const sliced = html.slice(linkTagIndex);
    const linkTag = sliced.slice(0, sliced.indexOf("}"));
    return "https://www.youtube.com/watch?v=" + linkTag.replace('{"status":"LIKE","target":{"videoId":', "").replace('}', "").replaceAll('"', "");
}
function isStreaming(html) {
    return (html.match(/"isLive":true/g) || []).length == 1 && !html.includes("Scheduled for");
}
async function retrieveCurrentState() {
    const addEvents = await events_db_1.default.queryEvents("yt_channels", "ADD_CHANNEL", new Date(0), {}, 10000);
    const removeEvents = await events_db_1.default.queryEvents("yt_channels", "REMOVE_CHANNEL", new Date(0), {}, 10000);
    //TODO: Replace with Object.groupBy
    let state = {};
    addEvents.forEach(a => {
        const k = `${a.channel_id}|${a.discord_server}`;
        if (!state[k]) {
            state[k] = [a];
        }
        else {
            state[k].push(a);
            state[k] = state[k].sort((a, b) => (b.timestamp.getTime() - a.timestamp.getTime())); // reverse chronologically order
        }
    });
    removeEvents.forEach(a => {
        const k = `${a.channel_id}|${a.discord_server}`;
        if (state?.[k]?.[0]) {
            if (a.timestamp > state[k][0].timestamp) {
                delete state[k];
            }
        }
    });
    return Object.keys(state).map(k => {
        const [channel_id, discord_server] = k.split("|");
        return { channel_id, discord_server };
    });
}
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
events_db_1.default.on("MADDEN_BROADCAST", async (events) => {
    events.map(async (broadcastEvent) => {
        const discordServer = broadcastEvent.key;
        const doc = await firebase_1.default.collection("league_settings").doc(discordServer).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        const configuration = leagueSettings.commands?.broadcast;
        if (!configuration) {
        }
        else {
            const channel = configuration.channel;
            const role = configuration.role ? `<@&${configuration.role.id}>` : "";
            try {
                await prodClient.createMessage(channel, `${role} ${broadcastEvent.title}\n\n${broadcastEvent.video}`, ["roles"]);
            }
            catch (e) {
            }
        }
    });
});
async function notifyYoutubeBroadcasts() {
    const currentChannelServers = await retrieveCurrentState();
    const currentChannels = [...new Set(currentChannelServers.map(c => c.channel_id))];
    const currentServers = [...new Set(currentChannelServers.map(c => c.discord_server))];
    const channels = await Promise.all(currentChannels
        .map(channel_id => fetch(`https://www.youtube.com/channel/${channel_id}/live`)
        .then(res => res.text())
        .then(t => isStreaming(t) ? [{ channel_id, title: extractTitle(t), video: extractVideo(t) }] : [])));
    const serverTitleKeywords = await Promise.all(currentServers.map(async (server) => {
        const doc = await firebase_1.default.collection("league_settings").doc(server).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        const configuration = leagueSettings.commands?.broadcast;
        if (!configuration) {
            console.error(`${server} is not configured for Broadcasts`);
            return [];
        }
        else {
            return [[server, configuration.title_keyword]];
        }
    }));
    const serverTitleMap = Object.fromEntries(serverTitleKeywords.flat());
    const currentlyLiveStreaming = channels.flat();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 1);
    const pastBroadcasts = await Promise.all(currentlyLiveStreaming.map(async (c) => {
        const pastVideos = await events_db_1.default.queryEvents(c.channel_id, "YOUTUBE_BROADCAST", startTime, {}, 2);
        return { [c.channel_id]: pastVideos.map(p => p.video) };
    }));
    const channelToPastBroadcastMap = pastBroadcasts.reduce((prev, curr) => {
        Object.assign(prev, curr);
        return prev;
    }, {});
    const newBroadcasts = currentlyLiveStreaming.filter(c => !channelToPastBroadcastMap[c.channel_id]?.includes(c.video));
    console.log(`broadcasts that are new: ${JSON.stringify(newBroadcasts)}`);
    await Promise.all(newBroadcasts.map(async (b) => {
        return await events_db_1.default.appendEvents([{ key: b.channel_id, event_type: "YOUTUBE_BROADCAST", video: b.video }], events_db_1.EventDelivery.EVENT_SOURCE);
    }));
    const channelTitleMap = Object.fromEntries(newBroadcasts.map(c => [[c.channel_id], { title: c.title, video: c.video }]));
    console.log(channelTitleMap);
    await Promise.all(currentChannelServers.filter(c => channelTitleMap[c.channel_id] && channelTitleMap[c.channel_id].title.toLowerCase().includes(serverTitleMap[c.discord_server].toLowerCase())).map(async (c) => {
        return await events_db_1.default.appendEvents([{ key: c.discord_server, event_type: "MADDEN_BROADCAST", title: channelTitleMap[c.channel_id].title, video: channelTitleMap[c.channel_id].video }], events_db_1.EventDelivery.EVENT_SOURCE);
    }));
}
notifyYoutubeBroadcasts();
//# sourceMappingURL=index.js.map