"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationChannelType = void 0;
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const settings_db_1 = require("../settings_db");
const embed_builder_1 = require("../embeds/embed_builder");
var NotificationChannelType;
(function (NotificationChannelType) {
    NotificationChannelType["ROSTER_UPDATES"] = "roster_updates";
    NotificationChannelType["STATS_UPDATES"] = "stats_updates";
    NotificationChannelType["TRADES"] = "trades";
    NotificationChannelType["FREE_AGENTS"] = "free_agents";
    NotificationChannelType["INJURIES"] = "injuries";
    NotificationChannelType["CONTRACTS"] = "contracts";
    NotificationChannelType["DRAFT"] = "draft";
    NotificationChannelType["PLAYOFFS"] = "playoffs";
})(NotificationChannelType || (exports.NotificationChannelType = NotificationChannelType = {}));
const CHANNEL_TYPE_DESCRIPTIONS = {
    [NotificationChannelType.ROSTER_UPDATES]: "Player roster changes, signings, and releases",
    [NotificationChannelType.STATS_UPDATES]: "Weekly player and team statistics updates",
    [NotificationChannelType.TRADES]: "Trade announcements and transaction details",
    [NotificationChannelType.FREE_AGENTS]: "Free agency signings and player movements",
    [NotificationChannelType.INJURIES]: "Player injury reports and status updates",
    [NotificationChannelType.CONTRACTS]: "Contract extensions, negotiations, and salary cap news",
    [NotificationChannelType.DRAFT]: "Draft picks, rookie signings, and draft analysis",
    [NotificationChannelType.PLAYOFFS]: "Playoff brackets, results, and championship updates"
};
const CHANNEL_TYPE_EMOJIS = {
    [NotificationChannelType.ROSTER_UPDATES]: "👥",
    [NotificationChannelType.STATS_UPDATES]: "📊",
    [NotificationChannelType.TRADES]: "🔄",
    [NotificationChannelType.FREE_AGENTS]: "🆓",
    [NotificationChannelType.INJURIES]: "🏥",
    [NotificationChannelType.CONTRACTS]: "💰",
    [NotificationChannelType.DRAFT]: "🎯",
    [NotificationChannelType.PLAYOFFS]: "🏆"
};
function createChannelListEmbed(channels) {
    const embed = embed_builder_1.EmbedBuilder.madden("📢 Notification Channels", "Current channel assignments for league notifications");
    let hasChannels = false;
    Object.entries(CHANNEL_TYPE_DESCRIPTIONS).forEach(([type, description]) => {
        const channelType = type;
        const channel = channels[channelType];
        const emoji = CHANNEL_TYPE_EMOJIS[channelType];
        if (channel) {
            embed.addField(`${emoji} ${type.replace('_', ' ').toUpperCase()}`, `<#${channel.id}>\n*${description}*`, true);
            hasChannels = true;
        }
    });
    if (!hasChannels) {
        embed.setDescription("No notification channels have been configured yet.\nUse `/set-channel` to assign channels for different notification types.");
        embed.setColor(embed_builder_1.EmbedColor.WARNING);
    }
    return embed;
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        if (!command.data.options) {
            throw new Error("Channel management command not configured properly");
        }
        const subCommand = command.data.options[0];
        const subCommandName = subCommand.name;
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (subCommandName === "set") {
            if (!subCommand.options || subCommand.options.length < 2) {
                throw new Error("Set channel command missing required parameters");
            }
            const channelType = subCommand.options[0].value;
            const channelId = subCommand.options[1].value;
            if (!Object.values(NotificationChannelType).includes(channelType)) {
                throw new Error(`Invalid channel type: ${channelType}`);
            }
            const channelConfig = {
                notification_channels: {
                    ...leagueSettings.commands?.channel_management?.notification_channels,
                    [channelType]: { id: channelId, id_type: settings_db_1.DiscordIdType.CHANNEL }
                }
            };
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    channel_management: channelConfig
                }
            }, { merge: true });
            const embed = embed_builder_1.EmbedBuilder.success("Channel Set Successfully", `${CHANNEL_TYPE_EMOJIS[channelType]} **${channelType.replace('_', ' ').toUpperCase()}** notifications will now be sent to <#${channelId}>`).addField("Description", CHANNEL_TYPE_DESCRIPTIONS[channelType], false);
            (0, discord_utils_1.respond)(ctx, {
                type: 4,
                data: {
                    embeds: [embed.build()]
                }
            });
        }
        else if (subCommandName === "list") {
            const channels = leagueSettings.commands?.channel_management?.notification_channels || {};
            const embed = createChannelListEmbed(channels);
            (0, discord_utils_1.respond)(ctx, {
                type: 4,
                data: {
                    embeds: [embed.build()]
                }
            });
        }
        else if (subCommandName === "remove") {
            if (!subCommand.options || subCommand.options.length < 1) {
                throw new Error("Remove channel command missing channel type parameter");
            }
            const channelType = subCommand.options[0].value;
            if (!Object.values(NotificationChannelType).includes(channelType)) {
                throw new Error(`Invalid channel type: ${channelType}`);
            }
            const currentChannels = leagueSettings.commands?.channel_management?.notification_channels || {};
            if (!currentChannels[channelType]) {
                const embed = embed_builder_1.EmbedBuilder.warning("Channel Not Set", `No channel is currently assigned for **${channelType.replace('_', ' ').toUpperCase()}** notifications.`);
                (0, discord_utils_1.respond)(ctx, {
                    type: 4,
                    data: {
                        embeds: [embed.build()]
                    }
                });
                return;
            }
            delete currentChannels[channelType];
            const channelConfig = {
                notification_channels: currentChannels
            };
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    channel_management: channelConfig
                }
            }, { merge: true });
            const embed = embed_builder_1.EmbedBuilder.success("Channel Removed", `${CHANNEL_TYPE_EMOJIS[channelType]} **${channelType.replace('_', ' ').toUpperCase()}** notifications have been disabled.`);
            (0, discord_utils_1.respond)(ctx, {
                type: 4,
                data: {
                    embeds: [embed.build()]
                }
            });
        }
    },
    commandDefinition() {
        return {
            name: "set-channel",
            description: "Manage notification channels for different league events",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "set",
                    description: "Set a notification channel for a specific event type",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "type",
                            description: "Type of notifications for this channel",
                            required: true,
                            choices: Object.entries(NotificationChannelType).map(([key, value]) => ({
                                name: `${CHANNEL_TYPE_EMOJIS[value]} ${key.replace('_', ' ')}`,
                                value: value
                            }))
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "Channel to receive notifications",
                            required: true,
                            channel_types: [v10_1.ChannelType.GuildText, v10_1.ChannelType.GuildNews]
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "list",
                    description: "List all configured notification channels",
                    options: []
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "remove",
                    description: "Remove a notification channel assignment",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "type",
                            description: "Type of notifications to disable",
                            required: true,
                            choices: Object.entries(NotificationChannelType).map(([key, value]) => ({
                                name: `${CHANNEL_TYPE_EMOJIS[value]} ${key.replace('_', ' ')}`,
                                value: value
                            }))
                        }
                    ]
                }
            ]
        };
    }
};
//# sourceMappingURL=channel_management.js.map