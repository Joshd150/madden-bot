import { DiscordClient } from "./discord_utils";
import { ChannelId, LoggerConfiguration, UserId } from "./settings_db";
interface Logger {
    logUsedCommand(command: string, author: UserId, client: DiscordClient): Promise<void>;
    logChannels(channels: ChannelId[], loggedAuthors: UserId[], client: DiscordClient): Promise<void>;
}
declare const _default: (config: LoggerConfiguration) => Logger;
export default _default;
//# sourceMappingURL=logging.d.ts.map