"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const settings_db_1 = require("../settings_db");
function createWaitlistMessage(waitlist) {
    return ("__**Waitlist**__\n" +
        waitlist.map((user, idx) => `${idx + 1}: <@${user.id}>`).join("\n"));
}
function respondWithWaitlist(ctx, waitlist) {
    if (waitlist.length === 0) {
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("Waitlist is empty"));
    }
    else {
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(createWaitlistMessage(waitlist)));
    }
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (!command.data.options) {
            throw new Error("misconfigured waitlist");
        }
        const subCommand = command.data.options[0];
        const subCommandName = subCommand.name;
        if (subCommandName === "list") {
            const waitlist = leagueSettings.commands.waitlist?.current_waitlist ?? [];
            respondWithWaitlist(ctx, waitlist);
        }
        else if (subCommandName === "add") {
            if (!subCommand.options) {
                throw new Error("misconfigured waitlist add");
            }
            const user = subCommand.options[0].value;
            const waitlist = leagueSettings.commands.waitlist?.current_waitlist ?? [];
            const position = Number((subCommand.options?.[1]?.value || waitlist.length + 1)) - 1;
            if (position > waitlist.length) {
                (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)("invalid position, beyond waitlist length"));
            }
            else {
                waitlist.splice(position, 0, { id: user, id_type: settings_db_1.DiscordIdType.USER });
                const conf = {
                    current_waitlist: waitlist
                };
                await db.collection("league_settings").doc(guild_id).set({
                    commands: {
                        waitlist: conf
                    }
                }, { merge: true });
                respondWithWaitlist(ctx, waitlist);
            }
        }
        else if (subCommandName === "remove") {
            if (!subCommand.options) {
                throw new Error("misconfigured waitlist remove");
            }
            const user = subCommand.options[0].value;
            const waitlist = leagueSettings.commands.waitlist?.current_waitlist ?? [];
            const newWaitlist = waitlist.filter((w) => w.id !== user);
            const conf = {
                current_waitlist: newWaitlist
            };
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    waitlist: conf
                }
            }, { merge: true });
            respondWithWaitlist(ctx, newWaitlist);
        }
        else if (subCommandName === "pop") {
            if (!subCommand.options) {
                throw new Error("misconfigured waitlist pop");
            }
            const position = Number(subCommand.options?.[0]?.value || 1);
            const waitlist = leagueSettings.commands.waitlist?.current_waitlist ?? [];
            const newWaitlist = waitlist.filter((_, idx) => idx !== position - 1);
            const conf = {
                current_waitlist: newWaitlist
            };
            await db.collection("league_settings").doc(guild_id).set({
                commands: {
                    waitlist: conf
                }
            }, { merge: true });
            respondWithWaitlist(ctx, newWaitlist);
        }
        else {
            (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`waitlist ${subCommandName} not found`));
        }
    },
    commandDefinition() {
        return {
            name: "waitlist",
            description: "handles the league waitlist: list, add, remove, pop",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "list",
                    description: "lists the current users in the waitlist",
                    options: []
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "add",
                    description: "adds a user to the waitlist",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.User,
                            name: "user",
                            description: "user to add to the waitlist",
                            required: true,
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "position",
                            description: "adds this user at that waitlist position, pushing the rest back",
                            required: false,
                        },
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "remove",
                    description: "removes a user from the waitlist ",
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
                    name: "pop",
                    description: "removes a user by their position, default to first in line",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "position",
                            description: "position to remove, defaults to the user on the top",
                            required: false,
                        },
                    ],
                },
            ]
        };
    }
};
//# sourceMappingURL=waitlist.js.map