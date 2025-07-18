import { SnallabotEvent } from "./../db/events_db";
import { DefensiveExport, KickingExport, PassingExport, PuntingExport, ReceivingExport, RosterExport, RushingExport, SchedulesExport, StandingExport, TeamExport, TeamStatsExport } from "./madden_league_types";
import { Stage } from "../dashboard/ea_client";
export declare enum ExportResult {
    SUCCESS = 0,
    FAILURE = 1
}
export interface MaddenExportDestination {
    leagueTeams(platform: string, leagueId: string, data: TeamExport): Promise<ExportResult>;
    standings(platform: string, leagueId: string, data: StandingExport): Promise<ExportResult>;
    schedules(platform: string, leagueId: string, week: number, stage: Stage, data: SchedulesExport): Promise<ExportResult>;
    punting(platform: string, leagueId: string, week: number, stage: Stage, data: PuntingExport): Promise<ExportResult>;
    teamStats(platform: string, leagueId: string, week: number, stage: Stage, data: TeamStatsExport): Promise<ExportResult>;
    passing(platform: string, leagueId: string, week: number, stage: Stage, data: PassingExport): Promise<ExportResult>;
    kicking(platform: string, leagueId: string, week: number, stage: Stage, data: KickingExport): Promise<ExportResult>;
    rushing(platform: string, leagueId: string, week: number, stage: Stage, data: RushingExport): Promise<ExportResult>;
    defense(platform: string, leagueId: string, week: number, stage: Stage, data: DefensiveExport): Promise<ExportResult>;
    receiving(platform: string, leagueId: string, week: number, stage: Stage, data: ReceivingExport): Promise<ExportResult>;
    freeagents(platform: string, leagueId: string, data: RosterExport): Promise<ExportResult>;
    teamRoster(platform: string, leagueId: string, teamId: string, data: RosterExport): Promise<ExportResult>;
}
export declare function MaddenUrlDestination(baseUrl: string): MaddenExportDestination;
export declare const SnallabotExportDestination: MaddenExportDestination;
export declare function createDestination(url: string): MaddenExportDestination;
export declare function sendEvents<T>(league: string, request_type: string, events: Array<SnallabotEvent<T>>, identifier: (e: T) => number): Promise<void>;
//# sourceMappingURL=exporter.d.ts.map