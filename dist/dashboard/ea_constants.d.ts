export declare const AUTH_SOURCE = 317239;
export declare const CLIENT_SECRET = "wfGAWnrxLroZOwwELYA2ZrAuaycuF2WDb00zOLv48Sb79viJDGlyD6OyK8pM5eIiv_20240731135155";
export declare const REDIRECT_URL = "http://127.0.0.1/success";
export declare const CLIENT_ID = "MCA_25_COMP_APP";
export declare const MACHINE_KEY = "444d362e8e067fe2";
export declare const EA_LOGIN_URL = "https://accounts.ea.com/connect/auth?hide_create=true&release_type=prod&response_type=code&redirect_uri=http://127.0.0.1/success&client_id=MCA_25_COMP_APP&machineProfileKey=444d362e8e067fe2&authentication_source=317239";
export declare const TWO_DIGIT_YEAR = "25";
export declare const YEAR = "2025";
export declare const VALID_ENTITLEMENTS: {
    xone: string;
    ps4: string;
    pc: string;
    ps5: string;
    xbsx: string;
    stadia: string;
};
export declare enum SystemConsole {
    XBOX_ONE = "xone",
    PS4 = "ps4",
    PC = "pc",
    PS5 = "ps5",
    XBOX_X = "xbsx",
    STADIA = "stadia"
}
export declare const ENTITLEMENT_TO_SYSTEM: {
    [x: string]: SystemConsole;
};
export declare const ENTITLEMENT_TO_VALID_NAMESPACE: {
    [x: string]: string;
};
export declare const SYSTEM_MAP: (a: string) => {
    xone: string;
    ps4: string;
    pc: string;
    ps5: string;
    xbsx: string;
    stadia: string;
};
export declare const NAMESPACES: {
    xbox: string;
    ps3: string;
    cem_ea_id: string;
    stadia: string;
};
export declare const BLAZE_SERVICE: {
    xone: string;
    ps4: string;
    pc: string;
    ps5: string;
    xbsx: string;
    stadia: string;
};
export declare const BLAZE_SERVICE_TO_PATH: {
    [x: string]: string;
};
export declare const BLAZE_PRODUCT_NAME: {
    xone: string;
    ps4: string;
    pc: string;
    ps5: string;
    xbsx: string;
    stadia: string;
};
export type AccountToken = {
    access_token: string;
    expires_in: number;
    id_token: null;
    refresh_token: string;
    token_type: "Bearer";
};
export type TokenInfo = {
    client_id: "MCA_25_COMP_APP";
    expires_in: number;
    persona_id: null;
    pid_id: string;
    pid_type: "NUCLEUS";
    scope: string;
    user_id: string;
};
export type Entitlement = {
    entitlementId: number;
    entitlementSource: string;
    entitlementTag: string;
    entitlementType: string;
    grantDate: string;
    groupName: string;
    isConsumable: boolean;
    lastModifiedDate: string;
    originPermissions: number;
    pidUri: string;
    productCatalog: string;
    productId: string;
    projectId: string;
    status: string;
    statusReasonCode: string;
    terminationDate: string;
    useCount: number;
    version: number;
};
export type Entitlements = {
    entitlements: {
        entitlement: Array<Entitlement>;
    };
};
export type Namespace = "xbox" | "ps3" | "cem_ea_id" | "stadia";
export type Persona = {
    dateCreated: string;
    displayName: string;
    isVisible: boolean;
    lastAuthenticated: string;
    name: string;
    namespaceName: Namespace;
    personaId: number;
    pidId: number;
    showPersona: string;
    status: string;
    statusReasonCode: string;
};
export type Personas = {
    personas: {
        persona: Array<Persona>;
    };
};
export type BlazeAuthenticatedResponse = {
    isAnonymous: boolean;
    isOfLegalContactAge: boolean;
    isUnderage: boolean;
    userLoginInfo: {
        accountId: number;
        blazeId: number;
        geoIpSucceeded: boolean;
        isFirstConsoleLogin: boolean;
        isFirstLogin: boolean;
        lastLoginDateTime: number;
        personaDetails: {
            displayName: string;
            extId: number;
            lastAuthenticated: number;
            personaId: number;
            status: string;
        };
        platformInfo: {
            clientPlatform: string;
            eaIds: {
                nucleusAccountId: number;
                originPersonaId: number;
                originPersonaName: string;
            };
            externalIds: {
                psnAccountId: number;
                steamAccountId: number;
                switchId: string;
                xblAccountId: number;
            };
        };
        previousAnonymousAccountId: number;
        sessionKey: string;
    };
};
export type GetMyLeaguesResponse = {
    responseInfo: {
        tdfid: number;
        tdfclass: string;
        value: {
            leagues: League[];
            message: string;
            success: boolean;
        };
    };
};
export type League = {
    lastAdvancedTimeSecs: number;
    calendarYear: number;
    numMembers: number;
    commish: Commish;
    creationTime: number;
    currentWeekCompleted: boolean;
    userFullName: string;
    userPosition: string;
    userTeamId: number;
    importedLeagueId: number;
    isImportable: boolean;
    isNextGameHome: boolean;
    isUsingUgc: boolean;
    joinsEnabled: boolean;
    leagueId: number;
    leagueName: string;
    nextOpponentTeamId: number;
    rosterId: number;
    settings: LeagueSettings;
    seasonSort: number;
    seasonText: string;
    secsSinceLastAdvancedTime: number;
    teamLogos: string;
    teams: string;
    userPlayerClass: string;
    userTeamLogoId: number;
    userTeamName: string;
};
export type Commish = {
    persona: string;
    userId: number;
};
export type LeagueSettings = {
    crossplayEnabled: boolean;
    legendsEnabled: boolean;
    leagueType: string;
    maxMembers: number;
    acceleratedClockEnabled: boolean;
    isPublic: boolean;
    quarterLength: number;
    skillLevel: string;
    leagueModeType: string;
};
export declare enum Stage {
    UNKNOWN = -1,
    PRESEASON = 0,
    SEASON = 1
}
export declare const exportOptions: {
    "Current Week": {
        stage: Stage;
        week: number;
    };
    "Preseason Week 1": {
        stage: Stage;
        week: number;
    };
    "Preseason Week 2": {
        stage: Stage;
        week: number;
    };
    "Preseason Week 3": {
        stage: Stage;
        week: number;
    };
    "Preseason Week 4": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 1": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 2": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 3": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 4": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 5": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 6": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 7": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 8": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 9": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 10": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 11": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 12": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 13": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 14": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 15": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 16": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 17": {
        stage: Stage;
        week: number;
    };
    "Regular Season Week 18": {
        stage: Stage;
        week: number;
    };
    "Wildcard Round": {
        stage: Stage;
        week: number;
    };
    "Divisional Round": {
        stage: Stage;
        week: number;
    };
    "Conference Championship Round": {
        stage: Stage;
        week: number;
    };
    Superbowl: {
        stage: Stage;
        week: number;
    };
    "All Weeks": {
        stage: Stage;
        week: number;
    };
};
type WeekInfo = {
    gamesPlayedCount: number;
    gamesPlayerStatsCount: number;
    gameTotalCount: number;
    stageIndex: number;
    weekIndex: number;
    weekTitle: string;
};
type CareerResponse = {
    flowName: string;
    action: string;
    responseKey: number;
    navigationString: string;
    title: string;
};
type CareerRequestInfo = {
    isBlocking: boolean;
    canDismiss: boolean;
    categoryPriorityCutoff: number;
    isConnectionRequired: boolean;
    canSubmitResponse: boolean;
    canUpdateResponse: boolean;
    requestData: any;
    expireTime: number;
    requestId: number;
    issueTime: number;
    isLockedPendingResolution: boolean;
    priority: number;
    isPersistent: boolean;
    isResponseRequired: boolean;
    isResolved: boolean;
    description: string;
    type: string;
    title: string;
    seenByUser: boolean;
    responseList: CareerResponse[];
    style: string;
};
type SeasonInfo = {
    isAnnualAwardsPeriodActive: boolean;
    displayWeek: number;
    calendarYear: number;
    superBowlNumber: number;
    isDraftScoutingActive: boolean;
    isDraftActive: boolean;
    isFreeAgentPeriodActive: boolean;
    isFantasyDraftActive: boolean;
    isGoalsPeriodActive: boolean;
    nextSeasonWeek: number;
    nextSeasonWeekType: number;
    offSeasonStage: number;
    offSeasonWeekCount: number;
    postSeasonWeekCount: number;
    isProBowlPlayable: boolean;
    isPracticeSquadPeriodActive: boolean;
    preseasonWeekCount: number;
    isReSignPeriodActive: boolean;
    regularSeasonWeekCount: number;
    isDemandReleasecoachAvailable: boolean;
    isInSeasonFreeAgentsAvailable: boolean;
    isLeagueStarted: boolean;
    maxYears: number;
    isDemandReleasePlayerAvailable: boolean;
    seasonWeek: number;
    seasonWeekType: number;
    seasonYear: number;
    weekTitle: string;
    seasonTitle: string;
    isTradingActive: boolean;
    totalSeasonWeekCount: number;
    isWeeklyAwardsPeriodActive: boolean;
};
type CareerHubInfo = {
    isLeagueAutoSimming: boolean;
    isLeagueAdvancing: boolean;
    requestInfoList: CareerRequestInfo[];
    seasonInfo: SeasonInfo;
};
type ExportSizeEstimateInfo = {
    defensiveStatsPerGameEstimate: number;
    kickingStatsPerGameEstimate: number;
    leagueTotalEstimate: number;
    leagueTeamTotalEstimate: number;
    rosterDataPerPlayerEstimate: number;
    passingStatsPerGameEstimate: number;
    puntingStatsPerGameEstimate: number;
    receivingStatsPerGameEstimate: number;
    rushingStatsPerGameEstimate: number;
    scheduleDataPerGameEstimate: number;
    standingsTotalEstimate: number;
    teamStatsPerGameEstimate: number;
};
type TeamInfo = {
    shortName: string;
    displayName: string;
    presentationId: number;
    teamId: number;
};
type SeasonGameInfo = {
    awayTeamPrimaryColorBlue: number;
    awayTeamPrimaryColorGreen: number;
    awayTeamPrimaryColorRed: number;
    awayCityName: string;
    awayTeamLogoId: number;
    awayLoss: number;
    awayName: string;
    awayTie: number;
    awayWin: number;
    isByeWeek: boolean;
    gameTime: string;
    displayedWeek: string;
    forceWin: number;
    homeLoss: number;
    homeName: string;
    homeTie: number;
    homeWin: number;
    matchup: string;
    isGamePlayed: boolean;
    result: string;
    week: number;
    weekType: number;
    homeTeamPrimaryColorBlue: number;
    homeTeamPrimaryColorGreen: number;
    homeTeamPrimaryColorRed: number;
    homeCityName: string;
    homeTeamLogoId: number;
    awayUserId: number;
    awayUserName: string;
    homeUserId: number;
    homeUserName: string;
    isAwayHuman: boolean;
    isHomeHuman: boolean;
    numberTimesPlayed: number;
    isBoxScoreUnavailable: boolean;
    awayTeam: number;
    homeTeam: number;
};
type LeagueScheduleItem = {
    canForceWin: boolean;
    seasonGameInfo: SeasonGameInfo;
    seasonGameKey: number;
};
type GameScheduleHubInfo = {
    userCanForceWin: boolean;
    leagueSchedule: LeagueScheduleItem[];
    userTeam: number;
};
type PlayerCountInfo = {
    freeAgentCount: number;
    practiceSquadCount: number;
    rosterCount: number;
    totalCount: number;
};
type UserAdminHubInfo = {
    userAdminInfo: {
        canEnableUnlimitedAutoPilot: boolean;
        isMasterUser: boolean;
        isAdmin: boolean;
        isDraftActive: boolean;
        isLeagueStarted: boolean;
        adminLevel: string;
        canAdminsBootAdmins: boolean;
        userId: number;
        canAdminsRemoveAdmins: boolean;
    };
    userInfoMap: {
        [key: string]: {
            defaultRequestActionTimeout: string;
            autoPilot: boolean;
            characterName: string;
            isCoach: boolean;
            isOwner: boolean;
            isOnline: boolean;
            position: number;
            readyToAdvance: boolean;
            teamName: string;
            userName: string;
            isAdmin: boolean;
            showNFLPA: boolean;
            portraitId: number;
            salaryCapPenalty: number;
            teamPrimaryColor: number;
            team: number;
            teamLogoId: number;
            gameInfo: string;
            adminLevel: string;
            userAttribute: number;
            durability: number;
            userId: number;
            intangible: number;
            legacyScore: number;
            overall: number;
            production: number;
            physical: number;
            size: number;
        };
    };
};
export type LeagueResponse = {
    availableWeekInfoList: WeekInfo[];
    careerHubInfo: CareerHubInfo;
    exportSizeEstimateInfo: ExportSizeEstimateInfo;
    gameScheduleHubInfo: GameScheduleHubInfo;
    playerCountInfo: PlayerCountInfo;
    message: string;
    secsSinceLastAdvancedTime: number;
    success: boolean;
    teamIdInfoList: TeamInfo[];
    userAdminHubInfo: UserAdminHubInfo;
};
export type BlazeLeagueResponse = {
    responseInfo: {
        tdfid: 3170390244;
        tdfclass: "Blaze::FranchiseMode::MobileCareer::GetLeagueHubResponse";
        value: LeagueResponse;
    };
};
export declare function seasonType(seasonInfo: SeasonInfo): "Preseason" | "Regular Season" | "Post Season" | "Off Season" | "something else";
export {};
//# sourceMappingURL=ea_constants.d.ts.map