"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exporterForLeague = exports.ExportContext = exports.storedTokenClient = exports.deleteLeague = exports.storeToken = exports.ephemeralClientFromToken = exports.BlazeError = exports.Stage = exports.LeagueData = void 0;
const undici_1 = require("undici");
const ea_constants_1 = require("./ea_constants");
const routes_1 = require("./routes");
const crypto_1 = require("crypto");
const buffer_1 = require("buffer");
const firebase_1 = __importDefault(require("../db/firebase"));
const exporter_1 = require("../export/exporter");
const config_1 = require("../config");
var LeagueData;
(function (LeagueData) {
    LeagueData["TEAMS"] = "CareerMode_GetLeagueTeamsExport";
    LeagueData["STANDINGS"] = "CareerMode_GetStandingsExport";
    LeagueData["WEEKLY_SCHEDULE"] = "CareerMode_GetWeeklySchedulesExport";
    LeagueData["RUSHING_STATS"] = "CareerMode_GetWeeklyRushingStatsExport";
    LeagueData["TEAM_STATS"] = "CareerMode_GetWeeklyTeamStatsExport";
    LeagueData["PUNTING_STATS"] = "CareerMode_GetWeeklyPuntingStatsExport";
    LeagueData["RECEIVING_STATS"] = "CareerMode_GetWeeklyReceivingStatsExport";
    LeagueData["DEFENSIVE_STATS"] = "CareerMode_GetWeeklyDefensiveStatsExport";
    LeagueData["KICKING_STATS"] = "CareerMode_GetWeeklyKickingStatsExport";
    LeagueData["PASSING_STATS"] = "CareerMode_GetWeeklyPassingStatsExport";
    LeagueData["TEAM_ROSTER"] = "CareerMode_GetTeamRostersExport";
})(LeagueData || (exports.LeagueData = LeagueData = {}));
var Stage;
(function (Stage) {
    Stage[Stage["PRESEASON"] = 0] = "PRESEASON";
    Stage[Stage["SEASON"] = 1] = "SEASON";
})(Stage || (exports.Stage = Stage = {}));
class BlazeError extends Error {
    error;
    constructor(error) {
        super(JSON.stringify(error));
        this.name = "BlazeError";
        this.error = error;
    }
}
exports.BlazeError = BlazeError;
// EA is on legaacy SSL, node by default rejects these requests. Have to turn off manually
const dispatcher = new undici_1.Agent({
    connect: {
        rejectUnauthorized: false,
        secureOptions: crypto_1.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    },
});
const headers = (t) => {
    return {
        "Accept-Charset": "UTF-8",
        "Accept": "application/json",
        "X-BLAZE-ID": ea_constants_1.BLAZE_SERVICE[t.console],
        "X-BLAZE-VOID-RESP": "XML",
        "X-Application-Key": "MADDEN-MCA",
        "Content-Type": "application/json",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 13; sdk_gphone_x86_64 Build/TE1A.220922.031)",
    };
};
async function refreshToken(token) {
    const now = new Date();
    if (now > token.expiry) {
        const res = await (0, undici_1.fetch)(`https://accounts.ea.com/connect/token`, {
            method: "POST",
            headers: {
                "Accept-Charset": "UTF-8",
                "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 13; sdk_gphone_x86_64 Build/TE1A.220922.031)",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Accept-Encoding": "gzip",
            },
            body: `grant_type=refresh_token&client_id=${ea_constants_1.CLIENT_ID}&client_secret=${ea_constants_1.CLIENT_SECRET}&release_type=prod&refresh_token=${token.refreshToken}&authentication_source=${ea_constants_1.AUTH_SOURCE}&token_format=JWS`,
        });
        const newToken = await res.json();
        if (!res.ok || !newToken.access_token) {
            throw new routes_1.EAAccountError(`Error refreshing tokens, response from EA ${JSON.stringify(newToken)}`, "The only solution may to unlink the dashboard and set it up again");
        }
        const newExpiry = new Date(new Date().getTime() + newToken.expires_in * 1000);
        return { accessToken: newToken.access_token, refreshToken: newToken.refresh_token, expiry: newExpiry, console: token.console, blazeId: token.blazeId };
    }
    else {
        return token;
    }
}
async function retrieveBlazeSession(token) {
    const res1 = await (0, undici_1.fetch)(`https://wal2.tools.gos.bio-iad.ea.com/wal/authentication/login`, {
        dispatcher: dispatcher,
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
            accessToken: token.accessToken,
            productName: ea_constants_1.BLAZE_PRODUCT_NAME[token.console],
        }),
    });
    const textResponse = await res1.text();
    try {
        const blazeSession = JSON.parse(textResponse);
        const sessionKey = blazeSession.userLoginInfo.sessionKey;
        const blazeId = blazeSession.userLoginInfo.personaDetails.personaId;
        return { blazeId: blazeId, sessionKey: sessionKey, requestId: 1 };
    }
    catch (e) {
        throw new routes_1.EAAccountError(`Could not connect to EA Blaze (Madden) Error from EA: ${textResponse}`, "This could be temporary (EA is down for example). Could mean to unlink and setup the dashboard as well");
    }
}
function calculateMessageAuthData(blazeId, requestId) {
    const rand4bytes = (0, crypto_1.randomBytes)(4);
    const requestData = JSON.stringify({
        staticData: "05e6a7ead5584ab4",
        requestId: requestId,
        blazeId: blazeId,
    });
    const staticBytes = buffer_1.Buffer.from("634203362017bf72f70ba900c0aa4e6b", "hex");
    const xorHash = (0, crypto_1.createHash)("md5")
        .update(rand4bytes)
        .update(staticBytes)
        .digest();
    const requestBuffer = buffer_1.Buffer.from(requestData, "utf-8");
    const scrambledBytes = requestBuffer.map((b, i) => b ^ xorHash[i % 16]);
    const authDataBytes = buffer_1.Buffer.concat([rand4bytes, scrambledBytes]);
    const staticAuthCode = buffer_1.Buffer.from("3a53413521464c3b6531326530705b70203a2900", "hex");
    const authCode = (0, crypto_1.createHash)("md5")
        .update(staticAuthCode)
        .update(authDataBytes)
        .digest("base64");
    const authData = authDataBytes.toString("base64");
    const authType = 17039361;
    return { authData, authCode, authType };
}
async function sendBlazeRequest(token, session, request) {
    const authData = calculateMessageAuthData(session.blazeId, session.requestId);
    const messageExpiration = Math.floor(new Date().getTime() / 1000);
    const { requestPayload, ...rest } = request;
    const body = {
        apiVersion: 2,
        clientDevice: 3,
        requestInfo: JSON.stringify({
            ...rest,
            messageAuthData: authData,
            messageExpirationTime: messageExpiration,
            deviceId: ea_constants_1.MACHINE_KEY,
            ipAddress: "127.0.0.1",
            requestPayload: JSON.stringify(requestPayload)
        })
    };
    const res1 = await (0, undici_1.fetch)(`https://wal2.tools.gos.bio-iad.ea.com/wal/mca/Process/${session.sessionKey}`, {
        dispatcher: dispatcher,
        method: "POST",
        headers: headers(token),
        body: JSON.stringify(body),
    });
    const txtResponse = await res1.text();
    try {
        const val = JSON.parse(txtResponse);
        if (val.error) {
            throw new BlazeError(val);
        }
        return val;
    }
    catch (e) {
        if (e instanceof BlazeError) {
            throw e;
        }
        throw new routes_1.EAAccountError(`Failed to send request to Blaze, Error: ${txtResponse}`, "No Guidance");
    }
}
async function getExportData(token, session, exportType, body) {
    const res1 = await (0, undici_1.fetch)(`https://wal2.tools.gos.bio-iad.ea.com/wal/mca/${exportType}/${session.sessionKey}`, {
        dispatcher: dispatcher,
        method: "POST",
        headers: headers(token),
        body: JSON.stringify(body)
    });
    try {
        const text = await res1.text();
        const replacedText = text.replaceAll(/[\u0000-\u001F\u007F-\u009F]/g, "");
        return JSON.parse(replacedText);
    }
    catch (e) {
        throw new routes_1.EAAccountError(`Could not fetch league data, error: ${e}`, "No Guidance");
    }
}
async function refreshBlazeSession(token, session) {
    try {
        // we send this request just to see if it succeeds
        await sendBlazeRequest(token, session, {
            commandName: "Mobile_GetMyLeagues",
            componentId: 2060,
            commandId: 801,
            requestPayload: {},
            componentName: "careermode",
        });
        return session;
    }
    catch (e) {
        if (e instanceof BlazeError) {
            const newSession = await retrieveBlazeSession(token);
            return { ...newSession, requestId: session.requestId };
        }
        throw e;
    }
}
async function ephemeralClientFromToken(token, session) {
    const validSession = session ? session : await retrieveBlazeSession(token);
    return {
        async getLeagues() {
            const res = await sendBlazeRequest(token, validSession, {
                commandName: "Mobile_GetMyLeagues",
                componentId: 2060,
                commandId: 801,
                requestPayload: {},
                componentName: "careermode",
            });
            return res.responseInfo.value.leagues;
        },
        async getLeagueInfo(leagueId) {
            const res = await sendBlazeRequest(token, validSession, {
                commandName: "Mobile_Career_GetLeagueHub",
                componentId: 2060,
                commandId: 811,
                requestPayload: {
                    leagueId: leagueId
                },
                componentName: "careermode",
            });
            return res.responseInfo.value;
        },
        async getTeams(leagueId) {
            return await getExportData(token, validSession, LeagueData.TEAMS, { leagueId: leagueId });
        },
        async getStandings(leagueId) {
            return await getExportData(token, validSession, LeagueData.STANDINGS, { leagueId: leagueId });
        },
        async getSchedules(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.WEEKLY_SCHEDULE, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getRushingStats(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.RUSHING_STATS, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getTeamStats(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.TEAM_STATS, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getPuntingStats(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.PUNTING_STATS, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getReceivingStats(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.RECEIVING_STATS, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getDefensiveStats(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.DEFENSIVE_STATS, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getKickingStats(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.KICKING_STATS, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getPassingStats(leagueId, stage, weekIndex) {
            return await getExportData(token, validSession, LeagueData.PASSING_STATS, { leagueId: leagueId, stageIndex: stage, weekIndex: weekIndex });
        },
        async getTeamRoster(leagueId, teamId, teamIndex) {
            return await getExportData(token, validSession, LeagueData.TEAM_ROSTER, {
                leagueId: leagueId, listIndex: teamIndex,
                returnFreeAgents: false,
                teamId: teamId,
            });
        },
        async getFreeAgents(leagueId) {
            return await getExportData(token, validSession, LeagueData.TEAM_ROSTER, {
                leagueId: leagueId, listIndex: -1,
                returnFreeAgents: true,
                teamId: 0,
            });
        },
        getSystemConsole() {
            return token.console;
        }
    };
}
exports.ephemeralClientFromToken = ephemeralClientFromToken;
const DEFAULT_EXPORT = `https://${config_1.DEPLOYMENT_URL}`;
async function storeToken(token, leagueId) {
    const leagueConnection = {
        blazeId: token.blazeId,
        leagueId: leagueId,
        destinations: {
            [DEFAULT_EXPORT]: { autoUpdate: true, leagueInfo: true, rosters: true, weeklyStats: true, url: DEFAULT_EXPORT, editable: false }
        }
    };
    await firebase_1.default.collection("league_data").doc(`${leagueId}`).set(leagueConnection);
    const tokenInformation = {
        token: token
    };
    await firebase_1.default.collection("blaze_tokens").doc(`${token.blazeId}`).set(tokenInformation);
}
exports.storeToken = storeToken;
async function deleteLeague(leagueId) {
    await firebase_1.default.collection("league_data").doc(`${leagueId}`).delete();
}
exports.deleteLeague = deleteLeague;
async function storedTokenClient(leagueId) {
    const doc = await firebase_1.default.collection("league_data").doc(`${leagueId}`).get();
    if (!doc.exists) {
        throw new Error(`League ${leagueId} not connected to snallabot`);
    }
    const leagueConnection = doc.data();
    const tokenDoc = await firebase_1.default.collection("blaze_tokens").doc(`${leagueConnection.blazeId}`).get();
    if (!doc.exists) {
        throw new Error(`League ${leagueId} is connected, but its missing EA connection with id ${leagueConnection.blazeId}`);
    }
    const token = tokenDoc.data();
    const newToken = await refreshToken(token.token);
    const session = token.session ? token.session : await retrieveBlazeSession(newToken);
    const newSession = await refreshBlazeSession(newToken, session);
    token.token = newToken;
    token.session = newSession;
    await firebase_1.default.collection("blaze_tokens").doc(`${token.token.blazeId}`).set(token, { merge: true });
    const eaClient = await ephemeralClientFromToken(newToken, newSession);
    return {
        getExports() {
            return leagueConnection.destinations;
        },
        async updateExport(destination) {
            await firebase_1.default.collection("league_data").doc(`${leagueId}`).set({
                destinations: {
                    [destination.url]: destination
                }
            }, { merge: true });
        },
        async removeExport(url) {
            delete leagueConnection.destinations[url];
            await firebase_1.default.collection("league_data").doc(`${leagueId}`).set(leagueConnection);
        },
        ...eaClient
    };
}
exports.storedTokenClient = storedTokenClient;
var ExportContext;
(function (ExportContext) {
    ExportContext["UNKNOWN"] = "UNKNOWN";
    // manual means directly done by user
    ExportContext["MANUAL"] = "MANUAL";
    // auto means through event driven/polling processes
    ExportContext["AUTO"] = "AUTO";
})(ExportContext || (exports.ExportContext = ExportContext = {}));
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
const STAGGERED_MAX_MS = 75; // to stagger requests to EA and other outbound services
const PRESEASON_WEEKS = Array.from({ length: 4 }, (v, index) => index);
const SEASON_WEEKS = Array.from({ length: 23 }, (v, index) => index).filter(i => i !== 21); // filters out pro bowl
async function exportData(data, destinations, leagueId, platform) {
    const leagueInfo = Object.values(destinations).filter(d => d.leagueInfo).map(d => (0, exporter_1.createDestination)(d.url));
    const weeklyStats = Object.values(destinations).filter(d => d.weeklyStats).map(d => (0, exporter_1.createDestination)(d.url));
    if (leagueInfo.length > 0) {
        await Promise.all(leagueInfo.flatMap(d => {
            return [d.leagueTeams(platform, leagueId, data.leagueTeams), d.standings(platform, leagueId, data.standings)];
        }));
    }
    if (weeklyStats.length > 0) {
        await Promise.all(weeklyStats.flatMap(d => {
            return data.weeks.flatMap(w => [
                d.passing(platform, leagueId, w.weekIndex + 1, w.stage, w.passing),
                d.schedules(platform, leagueId, w.weekIndex + 1, w.stage, w.schedules),
                d.teamStats(platform, leagueId, w.weekIndex + 1, w.stage, w.teamstats),
                d.defense(platform, leagueId, w.weekIndex + 1, w.stage, w.defense),
                d.punting(platform, leagueId, w.weekIndex + 1, w.stage, w.punting),
                d.receiving(platform, leagueId, w.weekIndex + 1, w.stage, w.receiving),
                d.kicking(platform, leagueId, w.weekIndex + 1, w.stage, w.kicking),
                d.rushing(platform, leagueId, w.weekIndex + 1, w.stage, w.rushing)
            ]);
        }));
    }
}
async function exportTeamData(data, destinations, leagueId, platform) {
    const roster = Object.values(destinations).filter(d => d.rosters).map(d => (0, exporter_1.createDestination)(d.url));
    if (roster.length > 0) {
        await Promise.all(roster.flatMap(d => {
            return Object.entries(data.roster).map(e => {
                const [teamId, roster] = e;
                if (teamId === "freeagents") {
                    return d.freeagents(platform, leagueId, roster);
                }
                return d.teamRoster(platform, leagueId, teamId, roster);
            });
        }));
    }
}
async function exporterForLeague(leagueId, context) {
    const client = await storedTokenClient(leagueId);
    const exports = client.getExports();
    const contextualExports = Object.fromEntries(Object.entries(exports).filter(e => {
        const [_, destination] = e;
        if (context === ExportContext.MANUAL) {
            return true;
        }
        else if (context === ExportContext.AUTO) {
            return destination.autoUpdate;
        }
        else {
            return true;
        }
    }));
    const leagueInfo = await client.getLeagueInfo(leagueId);
    const staggeringCall = async (p, waitTime = STAGGERED_MAX_MS) => {
        await new Promise(r => setTimeout(r, randomIntFromInterval(1, waitTime)));
        return await p;
    };
    return {
        exportCurrentWeek: async function () {
            const weekIndex = leagueInfo.careerHubInfo.seasonInfo.seasonWeek;
            const stage = leagueInfo.careerHubInfo.seasonInfo.seasonWeekType === 0 ? 0 : 1;
            await this.exportSpecificWeeks([{ weekIndex, stage }]);
        },
        exportSurroundingWeek: async function () {
            const currentWeek = leagueInfo.careerHubInfo.seasonInfo.seasonWeekType === 8
                ? 22
                : leagueInfo.careerHubInfo.seasonInfo.seasonWeek;
            const stage = leagueInfo.careerHubInfo.seasonInfo.seasonWeekType == 0 ? 0 : 1;
            const maxWeekIndex = stage === 0 ? 3 : 22;
            const previousWeek = currentWeek - 1;
            const nextWeek = currentWeek + 1;
            const weeksToExport = [
                previousWeek === 21 ? 20 : previousWeek,
                currentWeek,
                nextWeek === 21 ? 22 : nextWeek,
            ].filter((c) => c >= 0 && c <= maxWeekIndex);
            await this.exportSpecificWeeks(weeksToExport.map(w => ({ weekIndex: w, stage: stage })));
        },
        exportAllWeeks: async function () {
            const weeksToExport = PRESEASON_WEEKS.map(weekIndex => ({
                weekIndex: weekIndex, stage: 0
            })).concat(SEASON_WEEKS.map(weekIndex => ({
                weekIndex: weekIndex, stage: 1
            })));
            await this.exportSpecificWeeks(weeksToExport);
        },
        exportSpecificWeeks: async function (weeks) {
            const destinations = Object.values(contextualExports);
            const data = { weeks: [], roster: {} };
            const dataRequests = [];
            function toStage(stage) {
                return stage === 0 ? Stage.PRESEASON : Stage.SEASON;
            }
            if (destinations.some(e => e.leagueInfo)) {
                dataRequests.push(client.getTeams(leagueId).then(t => data.leagueTeams = t));
                dataRequests.push(client.getStandings(leagueId).then(t => data.standings = t));
            }
            if (destinations.some(e => e.weeklyStats)) {
                weeks.forEach(week => {
                    const stage = toStage(week.stage);
                    const weekData = { weekIndex: week.weekIndex, stage: stage };
                    dataRequests.push(client.getPassingStats(leagueId, stage, week.weekIndex).then(s => weekData.passing = s));
                    dataRequests.push(client.getSchedules(leagueId, stage, week.weekIndex).then(s => weekData.schedules = s));
                    dataRequests.push(client.getTeamStats(leagueId, stage, week.weekIndex).then(s => weekData.teamstats = s));
                    dataRequests.push(client.getDefensiveStats(leagueId, stage, week.weekIndex).then(s => weekData.defense = s));
                    dataRequests.push(client.getPuntingStats(leagueId, stage, week.weekIndex).then(s => weekData.punting = s));
                    dataRequests.push(client.getReceivingStats(leagueId, stage, week.weekIndex).then(s => weekData.receiving = s));
                    dataRequests.push(client.getKickingStats(leagueId, stage, week.weekIndex).then(s => weekData.kicking = s));
                    dataRequests.push(client.getRushingStats(leagueId, stage, week.weekIndex).then(s => weekData.rushing = s));
                    data.weeks.push(weekData);
                });
            }
            // avoid using too much memory, process weekly data first then team rosters
            await Promise.all(dataRequests.map(request => staggeringCall(request, 50)));
            await exportData(data, contextualExports, `${leagueId}`, client.getSystemConsole());
            if (destinations.some(e => e.rosters)) {
                let teamRequests = [];
                let teamData = { roster: {} };
                const teamList = leagueInfo.teamIdInfoList;
                teamRequests.push(client.getFreeAgents(leagueId).then(freeAgents => teamData.roster["freeagents"] = freeAgents));
                for (let idx = 0; idx < teamList.length; idx++) {
                    const team = teamList[idx];
                    teamRequests.push(client.getTeamRoster(leagueId, team.teamId, idx).then(roster => teamData.roster[`${team.teamId}`] = roster));
                    if ((idx + 1) % 4 == 0) {
                        await Promise.all(teamRequests);
                        await exportTeamData(teamData, contextualExports, `${leagueId}`, client.getSystemConsole());
                        teamRequests = [];
                        teamData = { roster: {} };
                    }
                }
                if (teamRequests.length > 0) {
                    await Promise.all(teamRequests);
                    await exportTeamData(teamData, contextualExports, `${leagueId}`, client.getSystemConsole());
                    teamRequests = [];
                    teamData = { roster: {} };
                }
            }
        }
    };
}
exports.exporterForLeague = exporterForLeague;
//# sourceMappingURL=ea_client.js.map