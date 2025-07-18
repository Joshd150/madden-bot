"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEvents = exports.createDestination = exports.SnallabotExportDestination = exports.MaddenUrlDestination = exports.ExportResult = void 0;
const madden_db_1 = __importDefault(require("../db/madden_db"));
const madden_hash_storage_1 = __importStar(require("../db/madden_hash_storage"));
const ea_client_1 = require("../dashboard/ea_client");
const config_1 = require("../config");
var ExportResult;
(function (ExportResult) {
    ExportResult[ExportResult["SUCCESS"] = 0] = "SUCCESS";
    ExportResult[ExportResult["FAILURE"] = 1] = "FAILURE";
})(ExportResult || (exports.ExportResult = ExportResult = {}));
function MaddenUrlDestination(baseUrl) {
    const url = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    async function exportWeeklyData(platform, leagueId, week, stage, data, ending) {
        const stagePrefix = stage === ea_client_1.Stage.SEASON ? "reg" : "pre";
        const res = await fetch(`${url}/${platform}/${leagueId}/week/${stagePrefix}/${week}/${ending}`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            }
        });
        return res.ok ? ExportResult.SUCCESS : ExportResult.FAILURE;
    }
    return {
        leagueTeams: async function (platform, leagueId, data) {
            const res = await fetch(`${url}/${platform}/${leagueId}/leagueteams`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                }
            });
            return res.ok ? ExportResult.SUCCESS : ExportResult.FAILURE;
        },
        standings: async function (platform, leagueId, data) {
            const res = await fetch(`${url}/${platform}/${leagueId}/standings`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                }
            });
            return res.ok ? ExportResult.SUCCESS : ExportResult.FAILURE;
        },
        schedules: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "schedules");
        },
        punting: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "punting");
        },
        teamStats: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "teamstats");
        },
        passing: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "passing");
        },
        kicking: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "kicking");
        },
        rushing: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "rushing");
        },
        defense: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "defense");
        },
        receiving: async function (platform, leagueId, week, stage, data) {
            return await exportWeeklyData(platform, leagueId, week, stage, data, "receiving");
        },
        freeagents: async function (platform, leagueId, data) {
            const res = await fetch(`${url}/${platform}/${leagueId}/freeagents/roster`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                }
            });
            return res.ok ? ExportResult.SUCCESS : ExportResult.FAILURE;
        },
        teamRoster: async function (platform, leagueId, teamId, data) {
            const res = await fetch(`${url}/${platform}/${leagueId}/team/${teamId}/roster`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                }
            });
            return res.ok ? ExportResult.SUCCESS : ExportResult.FAILURE;
        }
    };
}
exports.MaddenUrlDestination = MaddenUrlDestination;
exports.SnallabotExportDestination = {
    leagueTeams: async function (platform, leagueId, data) {
        const events = data.leagueTeamInfoList.map(team => ({ key: leagueId, platform: platform, event_type: "MADDEN_TEAM", ...team }));
        await sendEvents(leagueId, "leagueteams", events, e => e.teamId);
        return ExportResult.SUCCESS;
    },
    standings: async function (platform, leagueId, data) {
        const events = data.teamStandingInfoList.map(standing => ({ key: leagueId, platform: platform, event_type: "MADDEN_STANDING", ...standing }));
        await sendEvents(leagueId, "standings", events, e => e.teamId);
        return ExportResult.SUCCESS;
    },
    schedules: async function (platform, leagueId, week, stage, data) {
        const events = data.gameScheduleInfoList.map(game => ({ key: leagueId, platform: platform, event_type: "MADDEN_SCHEDULE", ...game }));
        await sendEvents(leagueId, `schedules${stage}-${week}`, events, e => e.scheduleId);
        return ExportResult.SUCCESS;
    },
    punting: async function (platform, leagueId, week, stage, data) {
        const events = data.playerPuntingStatInfoList.map(stat => ({ key: leagueId, platform: platform, event_type: "MADDEN_PUNTING_STAT", ...stat }));
        await sendEvents(leagueId, `punting${stage}-${week}`, events, e => e.statId);
        return ExportResult.SUCCESS;
    },
    teamStats: async function (platform, leagueId, week, stage, data) {
        const events = data.teamStatInfoList.map(stat => ({ key: leagueId, platform: platform, event_type: "MADDEN_TEAM_STAT", ...stat }));
        await sendEvents(leagueId, `teamstats${stage}-${week}`, events, e => e.statId);
        return ExportResult.SUCCESS;
    },
    passing: async function (platform, leagueId, week, stage, data) {
        const events = data.playerPassingStatInfoList.map(stat => ({ key: leagueId, platform: platform, event_type: "MADDEN_PASSING_STAT", ...stat }));
        await sendEvents(leagueId, `passing${stage}-${week}`, events, e => e.statId);
        return ExportResult.SUCCESS;
    },
    kicking: async function (platform, leagueId, week, stage, data) {
        const events = data.playerKickingStatInfoList.map(stat => ({ key: leagueId, platform: platform, event_type: "MADDEN_KICKING_STAT", ...stat }));
        await sendEvents(leagueId, `kicking${stage}-${week}`, events, e => e.statId);
        return ExportResult.SUCCESS;
    },
    rushing: async function (platform, leagueId, week, stage, data) {
        const events = data.playerRushingStatInfoList.map(stat => ({ key: leagueId, platform: platform, event_type: "MADDEN_RUSHING_STAT", ...stat }));
        await sendEvents(leagueId, `rushing${stage}-${week}`, events, e => e.statId);
        return ExportResult.SUCCESS;
    },
    defense: async function (platform, leagueId, week, stage, data) {
        const events = data.playerDefensiveStatInfoList.map(stat => ({ key: leagueId, platform: platform, event_type: "MADDEN_DEFENSIVE_STAT", ...stat }));
        await sendEvents(leagueId, `defense${stage}-${week}`, events, e => e.statId);
        return ExportResult.SUCCESS;
    },
    receiving: async function (platform, leagueId, week, stage, data) {
        const events = data.playerReceivingStatInfoList.map(stat => ({ key: leagueId, platform: platform, event_type: "MADDEN_RECEIVING_STAT", ...stat }));
        await sendEvents(leagueId, `receiving${stage}-${week}`, events, e => e.statId);
        return ExportResult.SUCCESS;
    },
    freeagents: async function (platform, leagueId, data) {
        const events = data.rosterInfoList.map(player => ({ key: leagueId, platform: platform, event_type: "MADDEN_PLAYER", ...player }));
        await sendEvents(leagueId, `rosterfreeagents`, events, e => e.rosterId);
        return ExportResult.SUCCESS;
    },
    teamRoster: async function (platform, leagueId, teamId, data) {
        const events = data.rosterInfoList.map(player => ({ key: leagueId, platform: platform, event_type: "MADDEN_PLAYER", team: teamId, ...player }));
        await sendEvents(leagueId, `roster${teamId}`, events, e => e.rosterId);
        return ExportResult.SUCCESS;
    }
};
function createDestination(url) {
    if (url.includes(config_1.DEPLOYMENT_URL)) {
        return exports.SnallabotExportDestination;
    }
    else {
        return MaddenUrlDestination(url);
    }
}
exports.createDestination = createDestination;
const hash = require("object-hash");
async function sendEvents(league, request_type, events, identifier) {
    if (events.length == 0) {
        return;
    }
    const eventType = events.map(e => e.event_type).pop();
    if (!eventType) {
        throw new Error("No Event Type found for " + request_type);
    }
    const oldTree = await madden_hash_storage_1.default.readTree(league, request_type, eventType);
    const hashToEvent = new Map(events.map(e => [hash(e), e]));
    const newNodes = events.sort(e => identifier(e)).map(e => ({ hash: hash(e), children: [] }));
    const newTree = (0, madden_hash_storage_1.createTwoLayer)(newNodes);
    const hashDifferences = (0, madden_hash_storage_1.findDifferences)(newTree, oldTree);
    if (hashDifferences.length > 0) {
        // if (hashDifferences.length > 0) {
        // console.log(newNodes)
        // }
        const finalEvents = hashDifferences.map(h => hashToEvent.get(h)).filter(e => e);
        await madden_db_1.default.appendEvents(finalEvents, (e) => `${identifier(e)}`);
        await madden_hash_storage_1.default.writeTree(league, request_type, eventType, newTree);
    }
    // else {
    //     console.debug("skipped writing!")
    // }
}
exports.sendEvents = sendEvents;
//# sourceMappingURL=exporter.js.map