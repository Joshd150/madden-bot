"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`bot is working`));
    },
    commandDefinition() {
        return {
            name: "test",
            description: "test the bot is responding",
            type: v10_1.ApplicationCommandType.ChatInput,
        };
    }
};
//# sourceMappingURL=test.js.map