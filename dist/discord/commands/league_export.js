"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const config_1 = require("../../config");
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`If you have not tried the snallabot dashboard, please use that. Run command /dashboard\nOtherwise, here are the export links to enter into the Madden Companion app:\n\n First time: https://${config_1.DEPLOYMENT_URL}/connect/discord/${guild_id}\nAfter first time: https://${config_1.DEPLOYMENT_URL}/`));
    },
    commandDefinition() {
        return {
            name: "league_export",
            description: "retrieve the Madden Companion App exporter url",
            type: v10_1.ApplicationCommandType.ChatInput,
        };
    }
};
//# sourceMappingURL=league_export.js.map