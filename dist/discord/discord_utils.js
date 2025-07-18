"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnallabotReactions = exports.createWeekKey = exports.SNALLABOT_TEST_USER = exports.SNALLABOT_USER = exports.formatTeamMessageName = exports.deferMessageInvisible = exports.deferMessage = exports.createMessageResponse = exports.respond = exports.createClient = exports.SnallabotDiscordError = exports.DiscordRequestError = exports.CommandMode = void 0;
const discord_interactions_1 = require("discord-interactions");
const v10_1 = require("discord-api-types/v10");
const settings_db_1 = require("./settings_db");
var CommandMode;
(function (CommandMode) {
    CommandMode["INSTALL"] = "INSTALL";
    CommandMode["DELETE"] = "DELETE";
})(CommandMode || (exports.CommandMode = CommandMode = {}));
// https://discord.com/developers/docs/topics/opcodes-and-status-codes
class DiscordRequestError extends Error {
    code;
    constructor(error) {
        super(JSON.stringify(error));
        this.name = "DiscordError";
        this.code = error.code;
    }
    isPermissionError() {
        return this.code == 50013 || this.code == 50001;
    }
}
exports.DiscordRequestError = DiscordRequestError;
const UNKNOWN_MESSAGE = 10008;
const UNKNOWN_CHANNEL = 10003;
class SnallabotDiscordError extends Error {
    guidance;
    code;
    constructor(error, guidance) {
        super(error.message);
        this.name = "SnallabotDiscordError";
        this.guidance = guidance;
        this.code = error.code;
    }
    isDeletedChannel() {
        return this.code === UNKNOWN_CHANNEL;
    }
    isDeletedMessage() {
        return this.code === UNKNOWN_MESSAGE;
    }
}
exports.SnallabotDiscordError = SnallabotDiscordError;
function createClient(settings) {
    async function sendDiscordRequest(endpoint, options, maxTries = 10) {
        // append endpoint to root API URL
        const url = "https://discord.com/api/v10/" + endpoint;
        if (options.body)
            options.body = JSON.stringify(options.body);
        let tries = 0;
        while (tries < maxTries) {
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bot ${settings.botToken}`,
                    "Content-Type": "application/json; charset=UTF-8",
                },
                ...options,
            });
            if (!res.ok) {
                const stringData = await res.text();
                let data = { message: "Snallabot Error, could not send to discord", code: 1 };
                try {
                    data = JSON.parse(stringData);
                }
                catch (e) {
                    console.error(`Error from Discord: ${e}`);
                }
                if (data.retry_after) {
                    tries = tries + 1;
                    const retryTime = data.retry_after;
                    await new Promise((r) => setTimeout(r, retryTime * 1000));
                }
                else {
                    throw new DiscordRequestError(data);
                }
            }
            else {
                return res;
            }
        }
        throw new Error("max tries reached");
    }
    async function installCommand(command, guildId) {
        const endpoint = guildId ? `applications/${settings.appId}/guilds/${guildId}/commands` : `applications/${settings.appId}/commands`;
        await sendDiscordRequest(endpoint, { method: "POST", body: command });
    }
    async function deleteCommand(command, guildId) {
        const getEndpoint = guildId ? `applications/${settings.appId}/guilds/${guildId}/commands` : `applications/${settings.appId}/commands`;
        const getCommandResponse = await sendDiscordRequest(getEndpoint, { method: "GET" });
        const commands = await getCommandResponse.json();
        const commandsToBeDeleted = commands.filter(c => c.name === command.name)
            .map(c => c.id);
        await Promise.all(commandsToBeDeleted.map(async (c) => {
            const deleteEndpoint = guildId ? `applications/${settings.appId}/guilds/${guildId}/commands/${c}` : `applications/${settings.appId}/commands/${c}`;
            await sendDiscordRequest(deleteEndpoint, { method: "DELETE" });
        }));
    }
    return {
        interactionVerifier: async (ctx) => {
            const signature = ctx.get("x-signature-ed25519");
            const timestamp = ctx.get("x-signature-timestamp");
            return await (0, discord_interactions_1.verifyKey)(ctx.request.rawBody, signature, timestamp, settings.publicKey);
        },
        handleSlashCommand: async (mode, command, guildId) => {
            if (mode === CommandMode.INSTALL) {
                await installCommand(command, guildId);
            }
            else if (mode === CommandMode.DELETE) {
                await deleteCommand(command, guildId);
            }
            else {
                throw new Error("invalid mode " + mode);
            }
        },
        editOriginalInteraction: async (token, body) => {
            try {
                await sendDiscordRequest(`webhooks/${settings.appId}/${token}/messages/@original`, { method: "PATCH", body });
            }
            catch (e) {
            }
        },
        createMessage: async (channel, content, allowedMentions = []) => {
            try {
                const res = await sendDiscordRequest(`channels/${channel.id}/messages`, {
                    method: "POST",
                    body: {
                        content: content,
                        allowed_mentions: {
                            parse: allowedMentions
                        }
                    }
                });
                const message = await res.json();
                return {
                    id: message.id, id_type: settings_db_1.DiscordIdType.MESSAGE
                };
            }
            catch (e) {
                if (e instanceof DiscordRequestError && e.isPermissionError()) {
                    throw new SnallabotDiscordError(e, `Snallabot does not have permission to create a message in <#${channel.id}>`);
                }
                throw e;
            }
        },
        editMessage: async (channel, messageId, content, allowedMentions = []) => {
            try {
                await sendDiscordRequest(`channels/${channel.id}/messages/${messageId.id}`, {
                    method: "PATCH",
                    body: {
                        content: content,
                        allowed_mentions: {
                            parse: allowedMentions
                        }
                    }
                });
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to edit message in channel <#${channel.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_MESSAGE) {
                        throw new SnallabotDiscordError(e, `Snallabot cannot edit message, it may have been deleted? Full discord error ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL) {
                        throw new SnallabotDiscordError(e, `Snallabot cannot edit message in channel because the channel (<#${channel.id}>) may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        deleteMessage: async (channel, messageId) => {
            try {
                await sendDiscordRequest(`channels/${channel.id}/messages/${messageId.id}`, {
                    method: "DELETE"
                });
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to delete message in channel <#${channel.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_MESSAGE) {
                        throw new SnallabotDiscordError(e, `Snallabot cannot delete message, it may have been deleted? Full discord error ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL) {
                        throw new SnallabotDiscordError(e, `Snallabot cannot delete message in channel because the channel (<#${channel.id}>) may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        createChannel: async (guild_id, channelName, category) => {
            try {
                const res = await sendDiscordRequest(`guilds/${guild_id}/channels`, {
                    method: "POST",
                    body: {
                        type: v10_1.ChannelType.GuildText,
                        name: channelName,
                        parent_id: category.id,
                    },
                });
                const channel = await res.json();
                return { id: channel.id, id_type: settings_db_1.DiscordIdType.CHANNEL };
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to create channel under category <#${category.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL) {
                        throw new SnallabotDiscordError(e, `Snallabot could not create channel under category (<#${category.id}>) may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        deleteChannel: async (channel) => {
            try {
                await sendDiscordRequest(`/channels/${channel.id}`, { method: "DELETE" });
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to delete channel <#${channel.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL) {
                        throw new SnallabotDiscordError(e, `Snallabot could not delete channel <#${channel.id}> may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        reactToMessage: async (reaction, message, channel) => {
            try {
                await sendDiscordRequest(`channels/${channel.id}/messages/${message.id}/reactions/${reaction}/@me`, { method: "PUT" });
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to react to message in  channel <#${channel.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL || e.code === UNKNOWN_MESSAGE) {
                        throw new SnallabotDiscordError(e, `Snallabot could not react to message in channel <#${channel.id}>. the channel or the message may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        getUsersReacted: async (reaction, message, channel) => {
            try {
                const res = await sendDiscordRequest(`channels/${channel.id}/messages/${message.id}/reactions/${reaction}`, { method: "GET" });
                const reactedUsers = await res.json();
                return reactedUsers.filter(u => u.id !== exports.SNALLABOT_USER && u.id !== exports.SNALLABOT_TEST_USER).map(u => ({ id: u.id, id_type: settings_db_1.DiscordIdType.USER }));
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to see users reacted to message in  channel <#${channel.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL || e.code === UNKNOWN_MESSAGE) {
                        throw new SnallabotDiscordError(e, `Snallabot could not have permissions to see users reacted to message in <#${channel.id}>. the channel or the message may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        getMessagesInChannel: async function (channelId, before) {
            const requestUrl = `/channels/${channelId.id}/messages?limit=100${before ? "before=" + before.id : ""}`;
            try {
                const res = await sendDiscordRequest(requestUrl, { method: "GET" });
                return await res.json();
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to get messages from  <#${channelId.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL || e.code === UNKNOWN_MESSAGE) {
                        throw new SnallabotDiscordError(e, `Snallabot could not get messages from  <#${channelId.id}>. the channel may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        createThreadInChannel: async function (channel, threadName) {
            try {
                const res = await sendDiscordRequest(`channels/${channel.id}/threads`, {
                    method: "POST",
                    body: {
                        name: threadName,
                        auto_archive_duration: 60,
                        type: 11,
                    }
                });
                const thread = (await res.json());
                const threadId = thread.id;
                return { id: threadId, id_type: settings_db_1.DiscordIdType.CHANNEL };
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to create thread in  <#${channel.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL || e.code === UNKNOWN_MESSAGE) {
                        throw new SnallabotDiscordError(e, `Snallabot could not create a thread in  <#${channel.id}>. the channel may have been deleted? Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        checkMessageExists: async function (channel, message) {
            try {
                await sendDiscordRequest(`channels/${channel.id}/messages/${message.id}`, {
                    method: "GET",
                });
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to create thread in  <#${channel.id}>. Full discord error: ${e.message}`);
                    }
                    else if (e.code === UNKNOWN_CHANNEL || e.code === UNKNOWN_MESSAGE) {
                        return false;
                    }
                }
                throw e;
            }
            return true;
        },
        getUsers: async function (guild_id) {
            try {
                const res = await sendDiscordRequest(`guilds/${guild_id}/members?limit=1000`, {
                    method: "GET",
                });
                return await res.json();
            }
            catch (e) {
                if (e instanceof DiscordRequestError) {
                    if (e.isPermissionError()) {
                        throw new SnallabotDiscordError(e, `Snallabot does not have permissions to get users so I can check their roles. Full discord error: ${e.message}`);
                    }
                }
                throw e;
            }
        },
        getChannel: async function (channel) {
            const channelInfoRes = await sendDiscordRequest(`channels/${channel.id}`, {
                method: "GET",
            });
            const channelInfo = (await channelInfoRes.json());
            return channelInfo;
        }
    };
}
exports.createClient = createClient;
function respond(ctx, body) {
    ctx.status = 200;
    ctx.set("Content-Type", "application/json");
    ctx.body = body;
}
exports.respond = respond;
function createMessageResponse(content, options = {}) {
    return {
        type: v10_1.InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: content,
            ...options
        }
    };
}
exports.createMessageResponse = createMessageResponse;
function deferMessage() {
    return {
        type: v10_1.InteractionResponseType.DeferredChannelMessageWithSource,
    };
}
exports.deferMessage = deferMessage;
function deferMessageInvisible() {
    return {
        type: v10_1.InteractionResponseType.DeferredChannelMessageWithSource,
        data: { flags: 64 }
    };
}
exports.deferMessageInvisible = deferMessageInvisible;
function formatTeamMessageName(discordId, gamerTag) {
    if (discordId) {
        return `<@${discordId}>`;
    }
    if (gamerTag) {
        return gamerTag;
    }
    return "CPU";
}
exports.formatTeamMessageName = formatTeamMessageName;
exports.SNALLABOT_USER = "970091866450198548";
exports.SNALLABOT_TEST_USER = "1099768386352840807";
function createWeekKey(season, week) {
    return `season${String(season).padStart(2, '0')}_week${String(week).padStart(2, '0')}`;
}
exports.createWeekKey = createWeekKey;
var SnallabotReactions;
(function (SnallabotReactions) {
    SnallabotReactions["SCHEDULE"] = "%E2%8F%B0";
    SnallabotReactions["GG"] = "%F0%9F%8F%86";
    SnallabotReactions["HOME"] = "%F0%9F%8F%A0";
    SnallabotReactions["AWAY"] = "%F0%9F%9B%AB";
    SnallabotReactions["SIM"] = "%E2%8F%AD%EF%B8%8F";
})(SnallabotReactions || (exports.SnallabotReactions = SnallabotReactions = {}));
//# sourceMappingURL=discord_utils.js.map