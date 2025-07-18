import { CommandHandler } from "../commands_handler";
import { TeamList } from "../../db/madden_db";
import { MaddenGame } from "../../export/madden_league_types";
import { ConfirmedSim } from "../../db/events";
export declare function formatScoreboard(week: number, seasonIndex: number, games: MaddenGame[], teams: TeamList, sims: ConfirmedSim[], leagueId: string): string;
declare const _default: CommandHandler;
export default _default;
//# sourceMappingURL=game_channels.d.ts.map