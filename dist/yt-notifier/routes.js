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
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeNotifierHandler = exports.extractChannelId = void 0;
const events_db_1 = __importStar(require("../db/events_db"));
function extractChannelId(html) {
    const linkTagIndex = html.indexOf('<link rel="canonical" href="');
    const sliced = html.slice(linkTagIndex);
    const linkTag = sliced.slice(0, sliced.indexOf(">"));
    return linkTag.replace('<link rel="canonical" href="', "").replace('>', "").replace('"', "").replace("https://www.youtube.com/channel/", "");
}
exports.extractChannelId = extractChannelId;
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
exports.youtubeNotifierHandler = {
    addYoutubeChannel: async (discordServer, youtubeUrl) => {
        const channelId = await fetch(youtubeUrl).then(r => r.text()).then(t => extractChannelId(t));
        if (channelId) {
            await events_db_1.default.appendEvents([{ key: "yt_channels", event_type: "ADD_CHANNEL", delivery: "EVENT_SOURCE", channel_id: channelId, discord_server: discordServer }], events_db_1.EventDelivery.EVENT_SOURCE);
        }
        else {
            throw new Error("could not find valid channel id");
        }
    },
    removeYoutubeChannel: async (discordServer, youtubeUrl) => {
        const channelId = await fetch(youtubeUrl).then(r => r.text()).then(t => extractChannelId(t));
        if (channelId) {
            await events_db_1.default.appendEvents([{ key: "yt_channels", event_type: "REMOVE_CHANNEL", delivery: "EVENT_SOURCE", channel_id: channelId, discord_server: discordServer }], events_db_1.EventDelivery.EVENT_SOURCE);
        }
        else {
            throw new Error("could not find valid channel id");
        }
    },
    listYoutubeChannels: async (discordServer) => {
        const state = await retrieveCurrentState();
        return state.filter(c => c.discord_server === discordServer).map(c => c.channel_id)
            .map(channel => `https://www.youtube.com/channel/${channel}`);
    }
};
//# sourceMappingURL=routes.js.map