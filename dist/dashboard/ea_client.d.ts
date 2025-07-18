import { SystemConsole, League, LeagueResponse } from "./ea_constants";
import { TeamExport, StandingExport, SchedulesExport, RushingExport, TeamStatsExport, PuntingExport, ReceivingExport, DefensiveExport, KickingExport, PassingExport, RosterExport } from "../export/madden_league_types";
export declare enum LeagueData {
    TEAMS = "CareerMode_GetLeagueTeamsExport",
    STANDINGS = "CareerMode_GetStandingsExport",
    WEEKLY_SCHEDULE = "CareerMode_GetWeeklySchedulesExport",
    RUSHING_STATS = "CareerMode_GetWeeklyRushingStatsExport",
    TEAM_STATS = "CareerMode_GetWeeklyTeamStatsExport",
    PUNTING_STATS = "CareerMode_GetWeeklyPuntingStatsExport",
    RECEIVING_STATS = "CareerMode_GetWeeklyReceivingStatsExport",
    DEFENSIVE_STATS = "CareerMode_GetWeeklyDefensiveStatsExport",
    KICKING_STATS = "CareerMode_GetWeeklyKickingStatsExport",
    PASSING_STATS = "CareerMode_GetWeeklyPassingStatsExport",
    TEAM_ROSTER = "CareerMode_GetTeamRostersExport"
}
export declare enum Stage {
    PRESEASON = 0,
    SEASON = 1
}
interface EAClient {
    getLeagues(): Promise<League[]>;
    getLeagueInfo(leagueId: number): Promise<LeagueResponse>;
    getTeams(leagueId: number): Promise<TeamExport>;
    getStandings(leagueId: number): Promise<StandingExport>;
    getSchedules(leagueId: number, stage: Stage, weekIndex: number): Promise<SchedulesExport>;
    getRushingStats(leagueId: number, stage: Stage, weekIndex: number): Promise<RushingExport>;
    getTeamStats(leagueId: number, stage: Stage, weekIndex: number): Promise<TeamStatsExport>;
    getPuntingStats(leagueId: number, stage: Stage, weekIndex: number): Promise<PuntingExport>;
    getReceivingStats(leagueId: number, stage: Stage, weekIndex: number): Promise<ReceivingExport>;
    getDefensiveStats(leagueId: number, stage: Stage, weekIndex: number): Promise<DefensiveExport>;
    getKickingStats(leagueId: number, stage: Stage, weekIndex: number): Promise<KickingExport>;
    getPassingStats(leagueId: number, stage: Stage, weekIndex: number): Promise<PassingExport>;
    getTeamRoster(leagueId: number, teamId: number, teamIndex: number): Promise<RosterExport>;
    getFreeAgents(leagueId: number): Promise<RosterExport>;
    getSystemConsole(): SystemConsole;
}
export type TokenInformation = {
    accessToken: string;
    refreshToken: string;
    expiry: Date;
    console: SystemConsole;
    blazeId: string;
};
export type SessionInformation = {
    blazeId: number;
    sessionKey: string;
    requestId: number;
};
export type BlazeRequest = {
    commandName: string;
    componentId: number;
    commandId: number;
    requestPayload: Record<string, any>;
    componentName: string;
};
type BlazeErrorResponse = {
    error: {
        errorname: string;
        component: number;
        errorcode: number;
        errordf: {
            commandSeverity: string;
            errorString: string;
        };
    };
};
export declare class BlazeError extends Error {
    error: BlazeErrorResponse;
    constructor(error: BlazeErrorResponse);
}
export declare function ephemeralClientFromToken(token: TokenInformation, session?: SessionInformation): Promise<EAClient>;
export type ExportDestination = {
    autoUpdate: boolean;
    leagueInfo: boolean;
    rosters: boolean;
    weeklyStats: boolean;
    url: string;
    lastExportAttempt?: Date;
    lastSuccessfulExport?: Date;
    editable: boolean;
};
export declare function storeToken(token: TokenInformation, leagueId: number): Promise<void>;
interface StoredEAClient extends EAClient {
    getExports(): {
        [key: string]: ExportDestination;
    };
    updateExport(destination: ExportDestination): Promise<void>;
    removeExport(url: string): Promise<void>;
}
export declare function deleteLeague(leagueId: number): Promise<void>;
export declare function storedTokenClient(leagueId: number): Promise<StoredEAClient>;
interface MaddenExporter {
    exportCurrentWeek(): Promise<void>;
    exportAllWeeks(): Promise<void>;
    exportSpecificWeeks(weeks: {
        weekIndex: number;
        stage: number;
    }[]): Promise<void>;
    exportSurroundingWeek(): Promise<void>;
}
export declare enum ExportContext {
    UNKNOWN = "UNKNOWN",
    MANUAL = "MANUAL",
    AUTO = "AUTO"
}
export declare function exporterForLeague(leagueId: number, context: ExportContext): Promise<MaddenExporter>;
export {};
//# sourceMappingURL=ea_client.d.ts.map