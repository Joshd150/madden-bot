"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const settings_db_1 = require("../settings_db");
const routes_1 = require("../../twitch-notifier/routes");
const routes_2 = require("../../yt-notifier/routes");
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        if (!command.data.options) {
            throw new Error("misconfigured broadcast");
        }
        const subCommand = command.data.options[0];
        const subCommandName = subCommand.name;
        if (subCommandName === "configure") {
            const configureCommand = subCommand;
            if (!configureCommand.options) {
                throw new Error("misconfigued broadcast configure");
            }
            const titleKeyword = configureCommand.options[0].value;
            const channel = configureCommand.options[1].value;
            const role = configureCommand.options?.[2]?.value;
            const conf = {
                title_keyword: titleKeyword,
                channel: { id: channel, id_type: settings_db_1.DiscordIdType.CHANNEL },
            };
            if (role) {
                conf.role = { id: role, id_type: settings_db_1.DiscordIdType.ROLE };
            }
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    broadcast: conf
                }
            }, { merge: true });
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Broadcast is configured!"));
        }
        else if (subCommandName === "youtube") {
            const subCommandGroup = subCommand;
            if (!subCommandGroup || !subCommandGroup.options) {
                throw new Error("youtube command misconfigured");
            }
            const groupCommand = subCommandGroup.options[0];
            const groupCommandName = groupCommand.name;
            if (groupCommandName === "list") {
                const youtubeUrls = await routes_2.youtubeNotifierHandler.listYoutubeChannels(guild_id);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`Here are your currently configured youtube channels:\n\n${youtubeUrls.join("\n")}`));
            }
            else if (groupCommandName === "add") {
                if (!groupCommand.options || !groupCommand.options[0]) {
                    throw new Error(`broadcast youtube ${groupCommandName} misconfigured`);
                }
                const youtubeUrl = groupCommand.options[0].value;
                await routes_2.youtubeNotifierHandler.addYoutubeChannel(guild_id, youtubeUrl);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Channel updated successfully"));
            }
            else if (groupCommandName === "remove") {
                if (!groupCommand.options || !groupCommand.options[0]) {
                    throw new Error(`broadcast youtube ${groupCommandName} misconfigured`);
                }
                const youtubeUrl = groupCommand.options[0].value;
                await routes_2.youtubeNotifierHandler.removeYoutubeChannel(guild_id, youtubeUrl);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Channel updated successfully"));
            }
            else {
                throw new Error(`broadcast youtube ${groupCommandName}`);
            }
        }
        else if (subCommandName === "twitch") {
            const subCommandGroup = subCommand;
            if (!subCommandGroup || !subCommandGroup.options) {
                throw new Error("twitch command misconfigured");
            }
            const groupCommand = subCommandGroup.options[0];
            const groupCommandName = groupCommand.name;
            if (groupCommandName === "list") {
                const twitchUrls = await routes_1.twitchNotifierHandler.listTwitchChannels(guild_id);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`Here are your currently configured twitch channels:\n\n${twitchUrls.join("\n")}`));
            }
            else if (groupCommandName === "add") {
                if (!groupCommand.options || !groupCommand.options[0]) {
                    throw new Error(`broadcast twitch ${groupCommandName} misconfigured`);
                }
                const twitchUrl = groupCommand.options[0].value;
                await routes_1.twitchNotifierHandler.addTwitchChannel(guild_id, twitchUrl);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Channel updated successfully"));
            }
            else if (groupCommandName === "remove") {
                if (!groupCommand.options || !groupCommand.options[0]) {
                    throw new Error(`broadcast twitch ${groupCommandName} misconfigured`);
                }
                const twitchUrl = groupCommand.options[0].value;
                await routes_1.twitchNotifierHandler.removeTwitchChannel(guild_id, twitchUrl);
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Channel updated successfully"));
            }
            else {
                throw new Error(`broadcast twitch ${groupCommandName} misconfigured`);
            }
        }
        else {
            throw new Error(`Broadcast SubCommand ${subCommandName} misconfigured`);
        }
    },
    commandDefinition() {
        return {
            name: "broadcasts",
            description: "sets up your league to start receiving twitch and youtube broadcasts",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "configures snallabot broadcaster",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "keyword",
                            description: "only show broadcasts with this keyword in the title",
                            required: true,
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "channel to send broadcasts to",
                            required: true,
                            channel_types: [v10_1.ChannelType.GuildText],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Role,
                            name: "notifier_role",
                            description: "optional role to notify on every broadcast",
                            required: false,
                        },
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.SubcommandGroup,
                    name: "youtube",
                    description: "configures youtube broadcasts",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Subcommand,
                            name: "add",
                            description: "add youtube broadcast",
                            options: [
                                {
                                    type: v10_1.ApplicationCommandOptionType.String,
                                    name: "youtube_channel",
                                    description: "the full youtube channel URL you want to show broadcasts for",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Subcommand,
                            name: "remove",
                            description: "remove youtube broadcast",
                            options: [
                                {
                                    type: v10_1.ApplicationCommandOptionType.String,
                                    name: "youtube_channel",
                                    description: "the youtube channel you want to remove",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Subcommand,
                            name: "list",
                            description: "list all youtube broadcast",
                            options: [],
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.SubcommandGroup,
                    name: "twitch",
                    description: "configures twitch broadcasts",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Subcommand,
                            name: "add",
                            description: "add twitch broadcast",
                            options: [
                                {
                                    type: v10_1.ApplicationCommandOptionType.String,
                                    name: "twitch_channel",
                                    description: "the twitch channel you want to show broadcasts for",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Subcommand,
                            name: "remove",
                            description: "remove twitch broadcast",
                            options: [
                                {
                                    type: v10_1.ApplicationCommandOptionType.String,
                                    name: "twitch_channel",
                                    description: "the twitch channel you want to remove",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Subcommand,
                            name: "list",
                            description: "list all twitch broadcast",
                            options: [],
                        },
                    ],
                },
            ]
        };
    }
};
//# sourceMappingURL=broadcasts.js.map