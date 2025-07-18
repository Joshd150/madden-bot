"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameChannelState = exports.DiscordIdType = void 0;
var DiscordIdType;
(function (DiscordIdType) {
    DiscordIdType["ROLE"] = "ROLE";
    DiscordIdType["CHANNEL"] = "CHANNEL";
    DiscordIdType["CATEGORY"] = "CATEGORY";
    DiscordIdType["USER"] = "USER";
    DiscordIdType["GUILD"] = "GUILD";
    DiscordIdType["MESSAGE"] = "MESSAGE";
})(DiscordIdType || (exports.DiscordIdType = DiscordIdType = {}));
var GameChannelState;
(function (GameChannelState) {
    GameChannelState["CREATED"] = "CREATED";
    GameChannelState["FORCE_WIN_REQUESTED"] = "FORCE_WIN_REQUESTED";
})(GameChannelState || (exports.GameChannelState = GameChannelState = {}));
//# sourceMappingURL=settings_db.js.map