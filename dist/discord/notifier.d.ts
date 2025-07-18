import { DiscordClient } from "./discord_utils";
import { GameChannel, LeagueSettings, UserId } from "./settings_db";
interface SnallabotNotifier {
    update(currentState: GameChannel, season: number, week: number): Promise<void>;
    deleteGameChannel(currentState: GameChannel, season: number, week: number, origin: UserId[]): Promise<void>;
    ping(currentState: GameChannel, season: number, week: number): Promise<void>;
}
declare function createNotifier(client: DiscordClient, guildId: string, settings: LeagueSettings): SnallabotNotifier;
export default createNotifier;
//# sourceMappingURL=notifier.d.ts.map