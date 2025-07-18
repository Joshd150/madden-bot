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
exports.twitchNotifierHandler = void 0;
const router_1 = __importDefault(require("@koa/router"));
const crypto_1 = require("crypto");
const firestore_1 = require("firebase-admin/firestore");
const twitch_client_1 = require("./twitch_client");
const node_cache_1 = __importDefault(require("node-cache"));
const firebase_1 = __importDefault(require("../db/firebase"));
const events_db_1 = __importStar(require("../db/events_db"));
const router = new router_1.default({ prefix: "/twitch" });
// Notification request headers
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase();
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase();
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type';
const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification';
const MESSAGE_TYPE_NOTIFICATION = 'notification';
const MESSAGE_TYPE_REVOCATION = 'revocation';
const HMAC_PREFIX = 'sha256=';
function getHmacMessage(ctx) {
    return (ctx.get(TWITCH_MESSAGE_ID) +
        ctx.get(TWITCH_MESSAGE_TIMESTAMP) +
        ctx.request.rawBody);
}
function getHmac(secret, message) {
    return (0, crypto_1.createHmac)('sha256', secret)
        .update(message)
        .digest('hex');
}
function verifyMessage(hmac, verifySignature) {
    return (0, crypto_1.timingSafeEqual)(Buffer.from(hmac), Buffer.from(verifySignature));
}
function createTwitchUrl(broadcasterLogin) {
    return `https://www.twitch.tv/${broadcasterLogin}`;
}
const twitchClient = (0, twitch_client_1.createTwitchClient)();
const CACHE_TTL = 10 * 60; // in seconds
const messageCache = new node_cache_1.default({ stdTTL: CACHE_TTL });
exports.twitchNotifierHandler = {
    addTwitchChannel: async (discordServer, twitchUrl) => {
        const broadcasterInformation = await twitchClient.retrieveBroadcasterInformation(twitchUrl);
        const broadcasterId = broadcasterInformation.data[0].id;
        const broadcasterLogin = broadcasterInformation.data[0].login;
        const currentSubscriptionDoc = await firebase_1.default.collection("twitch_notifiers").doc(broadcasterId).get();
        if (currentSubscriptionDoc.exists) {
            await firebase_1.default.collection("twitch_notifiers").doc(broadcasterId).set({
                servers: {
                    [discordServer]: { subscribed: true }
                }
            }, { merge: true });
        }
        else {
            const subscription = await twitchClient.subscribeBroadcasterStreamOnline(broadcasterId);
            const subscriptionId = subscription.data?.[0]?.id;
            if (!subscriptionId) {
                throw new Error(`Subscription response not formed correctly: ${subscription}`);
            }
            await firebase_1.default.collection("twitch_notifiers").doc(broadcasterId).set({
                subscriptionId: subscriptionId,
                broadcasterLogin: broadcasterLogin,
                servers: {
                    [discordServer]: { subscribed: true }
                }
            });
        }
    },
    removeTwitchChannel: async (discordServer, twitchUrl) => {
        const broadcasterInformation = await twitchClient.retrieveBroadcasterInformation(twitchUrl);
        const broadcasterId = broadcasterInformation.data[0].id;
        const currentSubscriptionDoc = await firebase_1.default.collection("twitch_notifiers").doc(broadcasterId).get();
        if (currentSubscriptionDoc.exists) {
            const currentSubscription = currentSubscriptionDoc.data();
            const numSubscribed = Object.entries(currentSubscription.servers).filter((entry) => entry[0] != discordServer && entry[1].subscribed).length;
            if (numSubscribed === 0) {
                await twitchClient.deleteSubscription(currentSubscription.subscriptionId);
                await firebase_1.default.collection("twitch_notifiers").doc(broadcasterId).delete();
            }
            else {
                await firebase_1.default.collection("twitch_notifiers").doc(broadcasterId).update({
                    [`servers.${discordServer}`]: firestore_1.FieldValue.delete()
                });
            }
        }
        else {
            throw new Error(`Twitch notifier does not exist for ${twitchUrl}. It may never have been added`);
        }
    },
    listTwitchChannels: async (discordServer) => {
        const notifiers = await firebase_1.default.collection("twitch_notifiers").where(`servers.${discordServer}.subscribed`, "==", true).get();
        return notifiers.docs.map(d => {
            const broadcasterLogin = d.data().broadcasterLogin;
            return createTwitchUrl(broadcasterLogin);
        });
    }
};
async function handleStreamEvent(twitchEvent) {
    const twitchUser = twitchEvent.event.broadcaster_user_id;
    const channelInformation = await twitchClient.retrieveChannelInformation(twitchUser);
    const broadcaster = channelInformation.data[0];
    const broadcasterName = broadcaster.broadcaster_name;
    const broadcastTitle = broadcaster.title;
    const subscriptionDoc = await firebase_1.default.collection("twitch_notifiers").doc(twitchUser).get();
    if (!subscriptionDoc.exists) {
        throw new Error(`Subscription for ${twitchUser} does not exist!`);
    }
    const subscription = subscriptionDoc.data();
    const subscribedServers = Object.entries(subscription.servers).filter(entry => entry[1].subscribed).map(entry => entry[0]);
    await Promise.all(subscribedServers.map(async (server) => {
        const doc = await firebase_1.default.collection("league_settings").doc(server).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        const configuration = leagueSettings.commands?.broadcast;
        if (!configuration) {
            console.error(`${server} is not configured for Broadcasts`);
        }
        else {
            const titleKeyword = configuration.title_keyword;
            if (broadcastTitle.toLowerCase().includes(titleKeyword.toLowerCase())) {
                await events_db_1.default.appendEvents([{
                        key: server, event_type: "MADDEN_BROADCAST", title: broadcastTitle, video: createTwitchUrl(broadcasterName)
                    }], events_db_1.EventDelivery.EVENT_SOURCE);
            }
        }
    }));
}
router.post("/webhook", async (ctx, next) => {
    const secret = (0, twitch_client_1.getSecret)();
    const message = getHmacMessage(ctx);
    const hmac = HMAC_PREFIX + getHmac(secret, message);
    if (verifyMessage(hmac, ctx.request.get(TWITCH_MESSAGE_SIGNATURE))) {
        await next();
    }
    else {
        ctx.status = 403;
    }
}, async (ctx, next) => {
    if (ctx.request.get(MESSAGE_TYPE) === MESSAGE_TYPE_VERIFICATION) {
        ctx.set({ "Content-Type": "text/plain" });
        ctx.status = 200;
        ctx.body = JSON.parse(ctx.request.rawBody).challenge;
    }
    else {
        await next();
    }
}, async (ctx, next) => {
    if (MESSAGE_TYPE_REVOCATION === ctx.request.get(MESSAGE_TYPE)) {
        ctx.status = 204;
    }
    else {
        try {
            await next();
        }
        catch (err) {
            console.error(err);
            ctx.status = 500;
            ctx.body = {
                message: err.message
            };
        }
    }
}, async (ctx, next) => {
    const twitchEvent = ctx.request.body;
    ctx.status = 200;
    await next();
    const messageId = ctx.request.get(TWITCH_MESSAGE_ID);
    const messageSeen = messageCache.get(messageId);
    if (messageSeen) {
        return;
    }
    handleStreamEvent(twitchEvent);
    messageCache.set(messageId, { seen: true });
});
exports.default = router;
//# sourceMappingURL=routes.js.map