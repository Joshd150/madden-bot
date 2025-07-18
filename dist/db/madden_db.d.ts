import { EventNotifier, SnallabotEvent } from "./events_db";
import { DefensiveStats, KickingStats, MaddenGame, PassingStats, Player, PuntingStats, ReceivingStats, RushingStats, Standing, Team } from "../export/madden_league_types";
import { TeamAssignments } from "../discord/settings_db";
export declare enum PlayerStatType {
    DEFENSE = 0,
    KICKING = 1,
    PUNTING = 2,
    RECEIVING = 3,
    RUSHING = 4,
    PASSING = 5
}
export type PlayerStats = {
    [PlayerStatType.DEFENSE]?: DefensiveStats[];
    [PlayerStatType.KICKING]?: KickingStats[];
    [PlayerStatType.PUNTING]?: PuntingStats[];
    [PlayerStatType.RECEIVING]?: ReceivingStats[];
    [PlayerStatType.RUSHING]?: RushingStats[];
    [PlayerStatType.PASSING]?: PassingStats[];
};
export type PlayerListQuery = {
    teamId?: number;
    position?: string;
    rookie?: boolean;
};
interface MaddenDB {
    appendEvents<Event>(event: SnallabotEvent<Event>[], idFn: (event: Event) => string): Promise<void>;
    on<Event>(event_type: string, notifier: EventNotifier<Event>): void;
    getLatestTeams(leagueId: string): Promise<TeamList>;
    getLatestWeekSchedule(leagueId: string, week: number): Promise<MaddenGame[]>;
    getWeekScheduleForSeason(leagueId: string, week: number, season: number): Promise<MaddenGame[]>;
    getGameForSchedule(leagueId: string, scheduleId: number, week: number, season: number): Promise<MaddenGame>;
    getStandingForTeam(leagueId: string, teamId: number): Promise<Standing>;
    getLatestStandings(leagueId: string): Promise<Standing[]>;
    getLatestPlayers(leagueId: string): Promise<Player[]>;
    getPlayer(leagueId: string, rosterId: string): Promise<Player>;
    getPlayerStats(leagueId: string, player: Player): Promise<PlayerStats>;
    getGamesForSchedule(leagueId: string, scheduleIds: Iterable<{
        id: number;
        week: number;
        season: number;
    }>): Promise<MaddenGame[]>;
    getPlayers(leagueId: string, query: PlayerListQuery, limit: number, startAfter?: Player, endBefore?: Player): Promise<Player[]>;
}
export interface TeamList {
    getTeamForId(id: number): Team;
    getLatestTeams(): Team[];
    getLatestTeamAssignments(assignments: TeamAssignments): TeamAssignments;
}
declare const MaddenDB: MaddenDB;
export default MaddenDB;
//# sourceMappingURL=madden_db.d.ts.map