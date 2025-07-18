import { CommandHandler } from "../commands_handler";
import { ChannelId } from "../settings_db";
export declare enum NotificationChannelType {
    ROSTER_UPDATES = "roster_updates",
    STATS_UPDATES = "stats_updates",
    TRADES = "trades",
    FREE_AGENTS = "free_agents",
    INJURIES = "injuries",
    CONTRACTS = "contracts",
    DRAFT = "draft",
    PLAYOFFS = "playoffs"
}
export type NotificationChannels = {
    [key in NotificationChannelType]?: ChannelId;
};
export type ChannelManagementConfiguration = {
    notification_channels: NotificationChannels;
};
declare const _default: CommandHandler;
export default _default;
//# sourceMappingURL=channel_management.d.ts.map