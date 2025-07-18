"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("./discord_utils");
const settings_db_1 = require("./settings_db");
// feels like setting a max is a good idea. 1000 messages
const MAX_PAGES = 10;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});
async function getMessages(channelId, client) {
    let messages = await client.getMessagesInChannel(channelId);
    let newMessages = messages;
    let page = 0;
    while (newMessages.length === 100 && page < MAX_PAGES) {
        const lastMessage = messages[messages.length - 1];
        newMessages = await client.getMessagesInChannel(channelId, { id: lastMessage.id, id_type: settings_db_1.DiscordIdType.MESSAGE });
        messages = messages.concat(newMessages);
        page = page + 1;
    }
    return messages.reverse();
}
function joinUsers(users) {
    return users.map((uId) => `<@${uId.id}>`).join("");
}
exports.default = (config) => ({
    logUsedCommand: async (command, author, client) => {
        const loggerChannel = config.channel;
        try {
            await client.createMessage(loggerChannel, `${command} by <@${author.id}>`, []);
        }
        catch (e) {
        }
    },
    logChannels: async (channels, loggedAuthors, client) => {
        const loggerChannels = channels.map(async (channel) => {
            try {
                const messages = await getMessages(channel, client);
                const logMessages = messages.map(m => ({ content: m.content, user: m.author.id, time: m.timestamp }));
                const channelInfo = await client.getChannel(channel);
                const channelName = channelInfo.name;
                await client.deleteChannel({ id: channelInfo.id, id_type: settings_db_1.DiscordIdType.CHANNEL });
                const loggerChannel = config.channel;
                const threadId = await client.createThreadInChannel(loggerChannel, `${channelName} channel log`);
                const messagePromise = logMessages.reduce((p, message) => {
                    return p.then(async (_) => {
                        try {
                            await client.createMessage(threadId, `<@${message.user}>: ${message.content} (<t:${Math.round(new Date(message.time).getTime() / 1000)}>)`, []);
                        }
                        catch (e) { }
                        return Promise.resolve();
                    });
                }, Promise.resolve());
                messagePromise.then(async (_) => {
                    try {
                        await client.createMessage(threadId, `cleared by ${joinUsers(loggedAuthors)}`, []);
                    }
                    catch (e) { }
                });
                return messagePromise;
            }
            catch (e) {
                if (e instanceof discord_utils_1.SnallabotDiscordError && e.isDeletedChannel()) {
                    return;
                }
            }
        });
        await Promise.all(loggerChannels);
    }
});
//# sourceMappingURL=logging.js.map