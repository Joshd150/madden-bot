"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const settings_db_1 = require("../settings_db");
async function moveStreamCountMessage(client, oldChannelId, oldMessageId, newChannelId, counts) {
    try {
        await client.deleteMessage(oldChannelId, oldMessageId);
        const message = await client.createMessage(newChannelId, createStreamCountMessage(counts), []);
        return { id: message.id, id_type: settings_db_1.DiscordIdType.MESSAGE };
    }
    catch (e) { }
    return { id: "0", id_type: settings_db_1.DiscordIdType.MESSAGE };
}
function createStreamCountMessage(counts) {
    const sortedCountsList = counts.sort((a, b) => a.count > b.count ? -1 : 1);
    return ("# Streams \n" +
        sortedCountsList
            .map((userCount) => `1. <@${userCount.user.id}>: ${userCount.count}`)
            .join("\n")
            .trim());
}
async function updateStreamMessage(ctx, streamConfiguration, client, newStreamMessage) {
    const channel = streamConfiguration.channel;
    const currentMessage = streamConfiguration.message;
    try {
        await client.editMessage(channel, currentMessage, newStreamMessage, []);
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("count updated!", { flags: 64 }));
        return currentMessage.id;
    }
    catch (e) {
        try {
            const message = await client.createMessage(channel, newStreamMessage, []);
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("count updated!", { flags: 64 }));
            return message.id;
        }
        catch (e) {
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("count was recorded, but I could not update the discord message error: " + e));
            return currentMessage.id;
        }
    }
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id, token } = command;
        if (!command.data.options) {
            throw new Error("logger command not defined properly");
        }
        const options = command.data.options;
        const streamsCommand = options[0];
        const subCommand = streamsCommand.name;
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (subCommand === "configure") {
            if (!streamsCommand.options || !streamsCommand.options[0]) {
                throw new Error("streams configure misconfigured");
            }
            const channel = { id: streamsCommand.options[0].value, id_type: settings_db_1.DiscordIdType.CHANNEL };
            const oldChannelId = leagueSettings?.commands?.stream_count?.channel;
            const counts = leagueSettings?.commands?.stream_count?.counts ?? [];
            if (oldChannelId && oldChannelId.id !== channel.id) {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
                // don't await so we can process these in the background
                const oldMessage = leagueSettings.commands?.stream_count?.message || {};
                const update = async (newMessageId) => {
                    const streamConfiguration = {
                        channel: channel,
                        counts: counts,
                        message: newMessageId
                    };
                    await db.collection("league_settings").doc(guild_id).set({
                        commands: {
                            stream_count: streamConfiguration
                        }
                    }, { merge: true });
                    await client.editOriginalInteraction(token, {
                        content: "Stream count re configured and moved"
                    });
                };
                moveStreamCountMessage(client, oldChannelId, oldMessage, channel, counts).then(update).catch(e => client.editOriginalInteraction(token, { content: `could not update stream configuration ${e}` }));
            }
            else {
                const oldMessage = leagueSettings?.commands?.stream_count?.message;
                if (oldMessage) {
                    try {
                        const messageExists = await client.checkMessageExists(channel, oldMessage);
                        if (messageExists) {
                            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Stream already configured"));
                        }
                        return;
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                const messageId = await client.createMessage(channel, createStreamCountMessage(counts), []);
                const streamConfiguration = {
                    channel: channel,
                    counts: counts,
                    message: messageId
                };
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        stream_count: streamConfiguration
                    }
                }, { merge: true });
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Stream Count configured"));
            }
        }
        else if (subCommand === "count") {
            if (!streamsCommand.options || !streamsCommand.options[0]) {
                throw new Error("streams count misconfigured");
            }
            const user = streamsCommand.options[0].value;
            if (leagueSettings?.commands?.stream_count?.channel?.id) {
                const currentCounts = leagueSettings?.commands?.stream_count?.counts ?? [];
                const step = Number(streamsCommand?.options?.[1]?.value || 1);
                const idx = currentCounts.findIndex(u => u.user.id === user);
                const newCounts = idx !== -1 ? currentCounts.map(u => u.user.id === user ? { user: u.user, count: u.count + step } : u) : currentCounts.concat([{ user: { id: user, id_type: settings_db_1.DiscordIdType.USER }, count: 1 }]);
                const newStreamMessage = createStreamCountMessage(newCounts);
                const newMessage = await updateStreamMessage(ctx, leagueSettings.commands.stream_count, client, newStreamMessage);
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        stream_count: {
                            counts: newCounts,
                            message: {
                                id: newMessage,
                                id_type: settings_db_1.DiscordIdType.MESSAGE
                            }
                        }
                    }
                }, { merge: true });
            }
            else {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Streams is not configured. run /streams configure"));
            }
        }
        else if (subCommand === "remove") {
            if (!streamsCommand.options || !streamsCommand.options[0]) {
                throw new Error("streams remove misconfigured");
            }
            const user = streamsCommand.options[0].value;
            if (leagueSettings?.commands?.stream_count?.channel?.id) {
                const currentCounts = leagueSettings?.commands?.stream_count?.counts ?? [];
                const newCounts = currentCounts.filter(u => u.user.id !== user);
                const newStreamMessage = createStreamCountMessage(newCounts);
                const newMessage = await updateStreamMessage(ctx, leagueSettings.commands.stream_count, client, newStreamMessage);
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        stream_count: {
                            counts: newCounts,
                            message: {
                                id: newMessage,
                                id_type: settings_db_1.DiscordIdType.MESSAGE
                            }
                        }
                    }
                }, { merge: true });
            }
            else {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Streams is not configured. run /streams configure"));
            }
        }
        else if (subCommand === "reset") {
            if (leagueSettings?.commands?.stream_count?.channel?.id) {
                const newCounts = [];
                const newStreamMessage = createStreamCountMessage(newCounts);
                const newMessage = await updateStreamMessage(ctx, leagueSettings.commands.stream_count, client, newStreamMessage);
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        stream_count: {
                            counts: newCounts,
                            message: {
                                id: newMessage,
                                id_type: settings_db_1.DiscordIdType.MESSAGE
                            }
                        }
                    }
                }, { merge: true });
            }
            else {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Streams is not configured. run /streams configure"));
            }
        }
        else {
            throw new Error(`streams ${subCommand} misconfigured`);
        }
    },
    commandDefinition() {
        return {
            type: v10_1.ApplicationCommandType.ChatInput,
            name: "streams",
            description: "streams: configure, count, remove, reset",
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "sets channel",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "channel to send message in",
                            required: true,
                            channel_types: [v10_1.ChannelType.GuildText],
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "count",
                    description: "ups the stream count by 1, optionally override the count",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user to count the stream for",
                            required: true,
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "increment",
                            description: "changes the increment from 1 to your choice. can be negative",
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand, // sub command
                    name: "remove",
                    description: "removes the user stream counts",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user to remove",
                            required: true,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "reset",
                    description: "DANGER resets all users to 0",
                    options: [],
                },
            ],
        };
    }
};
//# sourceMappingURL=streams.js.map