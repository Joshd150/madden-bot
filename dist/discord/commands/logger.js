"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const firestore_1 = require("firebase-admin/firestore");
const settings_db_1 = require("../settings_db");
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        if (!command.data.options) {
            throw new Error("logger command not defined properly");
        }
        const options = command.data.options;
        const loggerConfigureCommand = options[0];
        const subCommand = loggerConfigureCommand.name;
        if (subCommand !== "configure") {
            throw new Error("logger command has extra command " + subCommand);
        }
        const subCommandOptions = loggerConfigureCommand.options;
        if (!subCommandOptions) {
            throw new Error("missing logger configure options!");
        }
        const channel = subCommandOptions[0].value;
        const on = subCommandOptions[1] ? subCommandOptions[1].value : true;
        if (on) {
            const loggerConfig = {
                channel: {
                    id: channel,
                    id_type: settings_db_1.DiscordIdType.CHANNEL
                },
            };
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    logger: loggerConfig
                }
            }, { merge: true });
        }
        else {
            await db.collection("league_settings").doc(guild_id).update({
                ["commands.logger"]: firestore_1.FieldValue.delete()
            });
        }
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`logger is ${on ? "on" : "off"}`));
    },
    commandDefinition() {
        return {
            name: "logger",
            description: "sets up snallabot logger",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "configure",
                    description: "sets the logger channel",
                    options: [{
                            type: v10_1.ApplicationCommandOptionType.Channel,
                            name: "channel",
                            description: "channel to log in",
                            required: true,
                            channel_types: [v10_1.ChannelType.GuildText]
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Boolean,
                            name: "on",
                            description: "turn on or off the logger",
                            required: false
                        }]
                }
            ]
        };
    }
};
//# sourceMappingURL=logger.js.map