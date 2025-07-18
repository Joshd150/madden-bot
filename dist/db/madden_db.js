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
exports.PlayerStatType = void 0;
const crypto_1 = require("crypto");
const firebase_1 = __importDefault(require("./firebase"));
const events_db_1 = __importStar(require("./events_db"));
const madden_league_types_1 = require("../export/madden_league_types");
var PlayerStatType;
(function (PlayerStatType) {
    PlayerStatType[PlayerStatType["DEFENSE"] = 0] = "DEFENSE";
    PlayerStatType[PlayerStatType["KICKING"] = 1] = "KICKING";
    PlayerStatType[PlayerStatType["PUNTING"] = 2] = "PUNTING";
    PlayerStatType[PlayerStatType["RECEIVING"] = 3] = "RECEIVING";
    PlayerStatType[PlayerStatType["RUSHING"] = 4] = "RUSHING";
    PlayerStatType[PlayerStatType["PASSING"] = 5] = "PASSING";
})(PlayerStatType || (exports.PlayerStatType = PlayerStatType = {}));
function convertDate(firebaseObject) {
    if (!firebaseObject)
        return null;
    for (const [key, value] of Object.entries(firebaseObject)) {
        // covert items inside array
        if (value && Array.isArray(value))
            firebaseObject[key] = value.map(item => convertDate(item));
        // convert inner objects
        if (value && typeof value === 'object') {
            firebaseObject[key] = convertDate(value);
        }
        // convert simple properties
        if (value && value.hasOwnProperty('_seconds'))
            firebaseObject[key] = value.toDate();
    }
    return firebaseObject;
}
function createEventHistoryUpdate(newEvent, oldEvent) {
    const change = {};
    Object.keys(newEvent).forEach(key => {
        const oldValue = oldEvent[key];
        if (typeof oldValue !== 'object') {
            const newValue = newEvent[key];
            if (newValue !== oldValue) {
                change[key] = {};
                oldValue !== undefined && (change[key].oldValue = oldValue);
                newValue !== undefined && (change[key].newValue = newValue);
            }
        }
    });
    return change;
}
function createTeamList(teams) {
    const latestTeamMap = new Map();
    const latestTeams = [];
    Object.entries(Object.groupBy(teams, t => t.divName)).forEach(divisionTeams => {
        const [_, divTeams] = divisionTeams;
        if (!divTeams) {
            return;
        }
        const matchingTeams = Object.values(Object.groupBy(divTeams, t => `${t.cityName}#${t.abbrName}`)).filter((t) => !!t);
        const unMatched = matchingTeams.filter(t => t && t.length === 1).flat();
        const matched = matchingTeams.filter(t => t && t.length !== 1);
        matched.forEach(matchedTeams => {
            const latestTeam = matchedTeams.reduce((latest, team) => (team.timestamp > latest.timestamp ? team : latest));
            latestTeams.push(latestTeam);
            matchedTeams.forEach(team => latestTeamMap.set(team.teamId, latestTeam));
        });
        if (unMatched.length > 0) {
            // lets just assume the unmatched are normal teams
            unMatched.forEach(unmatched => {
                latestTeams.push(unmatched);
                latestTeamMap.set(unmatched.teamId, unmatched);
            });
        }
    });
    return {
        getTeamForId: function (id) {
            const team = latestTeamMap.get(id);
            if (team) {
                return team;
            }
            throw new Error("Team not found for id " + id);
        },
        getLatestTeams: function () { return latestTeams; },
        getLatestTeamAssignments: function (assignments) {
            return Object.fromEntries(Object.entries(assignments).map(entry => {
                const [teamId, assignment] = entry;
                const latestTeam = this.getTeamForId(Number(teamId));
                return [latestTeam.teamId + "", assignment];
            }));
        }
    };
}
async function getStats(leagueId, rosterId, collection) {
    const stats = await firebase_1.default.collection("league_data").doc(leagueId).collection(collection).where("rosterId", "==", rosterId).get();
    const playerStats = stats.docs.map(d => d.data()).filter(d => d.stageIndex > 0);
    try {
        const historyDocs = await firebase_1.default.collectionGroup("history").where("rosterId.oldValue", "==", rosterId).get();
        const fromhistory = await Promise.all(historyDocs.docs.filter(d => {
            return d.ref.parent.parent?.parent.id === collection;
        }).flatMap(d => d.ref.parent.parent?.id ? [d.ref.parent.parent.id] : [])
            .map(async (docId) => {
            const ogDoc = await firebase_1.default.collection("league_data").doc(leagueId).collection(collection).doc(docId).get();
            const data = ogDoc.data();
            const histories = await firebase_1.default.collection("league_data").doc(leagueId).collection(collection).doc(docId).collection("history").get();
            const changes = histories.docs.map(d => convertDate(d.data()));
            const historyStats = reconstructFromHistory(changes, data);
            historyStats.push(data);
            return historyStats.filter(d => d.rosterId === rosterId && d.stageIndex > 0);
        }));
        return playerStats.concat(fromhistory.flat());
    }
    catch (e) {
        return playerStats;
    }
}
function reconstructFromHistory(histories, og) {
    const changes = histories.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const all = [];
    let previousVersion = { ...og };
    for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        const reconstructedSchedule = { ...previousVersion };
        Object.entries(change).forEach(([field, values]) => {
            if (field !== "timestamp") {
                reconstructedSchedule[field] = values.oldValue;
            }
            else {
                reconstructedSchedule.timestamp = values;
            }
        });
        all.push(reconstructedSchedule);
        previousVersion = { ...reconstructedSchedule };
    }
    return all;
}
const MaddenDB = {
    async appendEvents(events, idFn) {
        const BATCH_SIZE = 500;
        const timestamp = new Date();
        const totalBatches = Math.ceil(events.length / BATCH_SIZE);
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIdx = batchIndex * BATCH_SIZE;
            const endIdx = Math.min((batchIndex + 1) * BATCH_SIZE, events.length);
            const batchEvents = events.slice(startIdx, endIdx);
            const batch = firebase_1.default.batch();
            await Promise.all(batchEvents.map(async (event) => {
                const eventId = idFn(event);
                const doc = firebase_1.default.collection("league_data").doc(event.key).collection(event.event_type).doc(eventId);
                const fetchedDoc = await doc.get();
                if (fetchedDoc.exists) {
                    const { timestamp: oldTimestamp, id, ...oldEvent } = fetchedDoc.data();
                    const change = createEventHistoryUpdate(event, oldEvent);
                    if (Object.keys(change).length > 0) {
                        const changeId = (0, crypto_1.randomUUID)();
                        const historyDoc = firebase_1.default.collection("league_data").doc(event.key).collection(event.event_type).doc(eventId).collection("history").doc(changeId);
                        batch.set(historyDoc, { ...change, timestamp: timestamp });
                    }
                }
                batch.set(doc, { ...event, timestamp: timestamp, id: eventId });
            }));
            let retryCount = 0;
            while (retryCount < 10) {
                try {
                    await batch.commit();
                    break;
                }
                catch (e) {
                    retryCount = retryCount + 1;
                    await new Promise((r) => setTimeout(r, 1000));
                    console.log("errored, slept and retrying, " + e);
                }
            }
        }
        Object.entries(Object.groupBy(events, e => e.event_type)).map(async (entry) => {
            const [eventType, specificTypeEvents] = entry;
            if (specificTypeEvents) {
                const eventTypeNotifiers = events_db_1.notifiers[eventType];
                if (eventTypeNotifiers) {
                    await Promise.all(eventTypeNotifiers.map(async (notifier) => {
                        try {
                            await notifier(specificTypeEvents);
                        }
                        catch (e) {
                            console.log("could not send event to notifier " + e);
                        }
                    }));
                }
            }
        });
    },
    on(event_type, notifier) {
        events_db_1.default.on(event_type, notifier);
    },
    getLatestTeams: async function (leagueId) {
        const teamDocs = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_TEAM").get();
        return createTeamList(teamDocs.docs.filter(d => d.id !== "leagueteams").map(d => d.data()));
    },
    getLatestWeekSchedule: async function (leagueId, week) {
        const weekDocs = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_SCHEDULE").where("weekIndex", "==", week - 1)
            .where("stageIndex", "==", 1).get();
        const maddenSchedule = weekDocs.docs.filter(d => !d.id.startsWith("schedules")).map(d => d.data())
            .filter(game => game.awayTeamId != 0 && game.homeTeamId != 0);
        if (maddenSchedule.length === 0) {
            throw new Error("Missing schedule for week " + week);
        }
        const bySeason = Object.groupBy(maddenSchedule, s => s.seasonIndex);
        const latestSeason = Math.max(...(Object.keys(bySeason).map(i => Number(i))));
        const latestSeasonSchedule = bySeason[latestSeason];
        if (latestSeasonSchedule) {
            return latestSeasonSchedule;
        }
        throw new Error("Missing schedule for week " + week);
    },
    getWeekScheduleForSeason: async function (leagueId, week, season) {
        const weekDocs = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_SCHEDULE").where("weekIndex", "==", week - 1).where("seasonIndex", "==", season)
            .where("stageIndex", "==", 1).get();
        const maddenSchedule = weekDocs.docs.filter(d => !d.id.startsWith("schedules")).map(d => d.data())
            .filter(game => game.awayTeamId != 0 && game.homeTeamId != 0);
        if (maddenSchedule.length !== 0) {
            return maddenSchedule;
        }
        const allDocs = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_SCHEDULE").get();
        const allGameChanges = await Promise.all(allDocs.docs.map(async (doc) => {
            if (doc.id.startsWith("schedules")) {
                return [];
            }
            const data = doc.data();
            const changesSnapshot = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_SCHEDULE").doc(doc.id).collection("history").get();
            const changes = changesSnapshot.docs.map(d => convertDate(d.data()));
            return reconstructFromHistory(changes, data);
        }));
        const allGames = Object.entries(Object.groupBy(allGameChanges.flat(), g => `${g.id}|${g.weekIndex}|${g.seasonIndex}`))
            .flatMap(entry => {
            const [_, gamesInWeek] = entry;
            if (gamesInWeek && gamesInWeek.length > 0) {
                return [gamesInWeek.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]];
            }
            return [];
        }).filter(g => g.weekIndex === week - 1 && g.seasonIndex === season && g.stageIndex > 0);
        if (allGames.length === 0) {
            throw new Error(`Missing schedule for week ${week} and season ${madden_league_types_1.MADDEN_SEASON + season}`);
        }
        return allGames;
    },
    getGameForSchedule: async function (leagueId, scheduleId, week, season) {
        const schedule = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_SCHEDULE").doc(`${scheduleId}`).get();
        if (!schedule.exists) {
            throw new Error("Schedule document not found for id " + scheduleId);
        }
        const game = schedule.data();
        if (game.weekIndex === week - 1 && season === game.seasonIndex) {
            return game;
        }
        const history = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_SCHEDULE").doc(`${scheduleId}`).collection("history").get();
        const changes = history.docs
            .map(doc => convertDate(doc.data()));
        const allGames = reconstructFromHistory(changes, game);
        const correctGame = allGames.filter(g => g.weekIndex === week - 1 && g.seasonIndex === season && g.stageIndex > 0)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (correctGame.length === 0) {
            throw new Error("Schedule not found for id " + scheduleId + ` ${week} and ${season}`);
        }
        return correctGame[0];
    },
    getStandingForTeam: async function (leagueId, teamId) {
        const standing = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_STANDING").doc(`${teamId}`).get();
        if (!standing.exists) {
            throw new Error("standing not found for id " + teamId);
        }
        return standing.data();
    },
    getLatestStandings: async function (leagueId) {
        const standingSnapshot = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_STANDING").get();
        return standingSnapshot.docs.filter(d => d.id !== "standings").map(doc => {
            return doc.data();
        });
    },
    getLatestPlayers: async function (leagueId) {
        const playerSnapshot = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_PLAYER").select("rosterId", "firstName", "lastName", "teamId", "position").get();
        return playerSnapshot.docs.filter(d => !d.id.startsWith("roster")).map(doc => {
            return doc.data();
        });
    },
    getPlayer: async function (leagueId, rosterId) {
        const playerDoc = await firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_PLAYER").doc(rosterId).get();
        if (playerDoc.exists) {
            return playerDoc.data();
        }
        throw new Error(`Player ${rosterId} not found in league ${leagueId}`);
    },
    getPlayerStats: async function (leagueId, player) {
        const rosterId = player.rosterId;
        switch (player.position) {
            case "QB":
                const [passingStats, rushingStats] = await Promise.all([getStats(leagueId, rosterId, "MADDEN_PASSING_STAT"), getStats(leagueId, rosterId, "MADDEN_RUSHING_STAT")]);
                return {
                    [PlayerStatType.PASSING]: passingStats,
                    [PlayerStatType.RUSHING]: rushingStats,
                };
            case "HB":
            case "FB":
            case "WR":
            case "TE":
                const [rushing, receivingStats] = await Promise.all([getStats(leagueId, rosterId, "MADDEN_RUSHING_STAT"), getStats(leagueId, rosterId, "MADDEN_RECEIVING_STAT")]);
                return {
                    [PlayerStatType.RUSHING]: rushing,
                    [PlayerStatType.RECEIVING]: receivingStats
                };
            case "K":
                const kickingStats = await getStats(leagueId, rosterId, "MADDEN_KICKING_STAT");
                return {
                    [PlayerStatType.KICKING]: kickingStats
                };
            case "P":
                const puntingStats = await getStats(leagueId, rosterId, "MADDEN_PUNTING_STAT");
                return {
                    [PlayerStatType.PUNTING]: puntingStats
                };
            case "LE":
            case "RE":
            case "DT":
            case "LOLB":
            case "ROLB":
            case "MLB":
            case "CB":
            case "FS":
            case "SS":
                const defenseStats = await getStats(leagueId, rosterId, "MADDEN_DEFENSIVE_STAT");
                return {
                    [PlayerStatType.DEFENSE]: defenseStats
                };
            default:
                return {};
        }
    },
    getGamesForSchedule: async function (leagueId, scheduleIds) {
        return await Promise.all(scheduleIds.map(s => this.getGameForSchedule(leagueId, s.id, s.week, s.season)));
    },
    getPlayers: async function (leagueId, query, limit, startAfter, endBefore) {
        let playersQuery;
        // flip the query for going backwards by ordering opposite and using start after
        if (endBefore) {
            playersQuery = firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_PLAYER").orderBy("playerBestOvr", "asc").orderBy("rosterId", "desc").limit(limit);
        }
        else {
            playersQuery = firebase_1.default.collection("league_data").doc(leagueId).collection("MADDEN_PLAYER").orderBy("playerBestOvr", "desc").orderBy("rosterId").limit(limit);
        }
        if ((query.teamId && query.teamId !== -1) || query.teamId === 0) {
            playersQuery = playersQuery.where("teamId", "==", query.teamId);
        }
        if (query.position) {
            if (madden_league_types_1.POSITION_GROUP.includes(query.position)) {
                if (query.position === "OL") {
                    playersQuery = playersQuery.where("position", "in", madden_league_types_1.oLinePositions);
                }
                else if (query.position === "DL") {
                    playersQuery = playersQuery.where("position", "in", madden_league_types_1.dLinePositions);
                }
                else if (query.position === "DB") {
                    playersQuery = playersQuery.where("position", "in", madden_league_types_1.dbPositions);
                }
            }
            else {
                playersQuery = playersQuery.where("position", "==", query.position);
            }
        }
        if (query.rookie) {
            playersQuery = playersQuery.where("yearsPro", "==", 0);
        }
        if (startAfter) {
            playersQuery = playersQuery.startAfter(startAfter.playerBestOvr, startAfter.rosterId);
        }
        if (endBefore) {
            playersQuery = playersQuery.startAfter(endBefore.playerBestOvr, endBefore.rosterId);
        }
        const snapshot = await playersQuery.get();
        const players = snapshot.docs.map(d => d.data());
        if (endBefore) {
            return players.reverse();
        }
        else {
            return players;
        }
    }
};
exports.default = MaddenDB;
//# sourceMappingURL=madden_db.js.map