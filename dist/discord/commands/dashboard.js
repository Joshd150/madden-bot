"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const config_1 = require("../../config");
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`Snallabot Dashboard: https://${config_1.DEPLOYMENT_URL}/dashboard?discord_connection=${guild_id}`));
    },
    commandDefinition() {
        return {
            name: "dashboard",
            description: "snallabot dashboard link",
            type: v10_1.ApplicationCommandType.ChatInput,
        };
    }
};
//# sourceMappingURL=dashboard.js.map