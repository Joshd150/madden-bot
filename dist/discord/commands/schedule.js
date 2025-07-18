"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const madden_league_types_1 = require("../../export/madden_league_types");
const madden_db_1 = __importDefault(require("../../db/madden_db"));
function format(schedule, teams, week) {
    const teamMap = new Map();
    teams.forEach(t => teamMap.set(t.teamId, t));
    const schedulesMessage = schedule.sort((a, b) => a.scheduleId - b.scheduleId).filter(w => w.awayTeamId !== 0 && w.homeTeamId !== 0).map(game => {
        if (game.status === madden_league_types_1.GameResult.NOT_PLAYED) {
            return `${teamMap.get(game.awayTeamId)?.displayName} vs ${teamMap.get(game.homeTeamId)?.displayName}`;
        }
        else {
            if (game.awayScore > game.homeScore) {
                return `**__${teamMap.get(game.awayTeamId)?.displayName} ${game.awayScore}__** vs ${game.homeScore} ${teamMap.get(game.homeTeamId)?.displayName}`;
            }
            else if (game.homeScore > game.awayScore) {
                return `${teamMap.get(game.awayTeamId)?.displayName} ${game.awayScore} vs **__${game.homeScore} ${teamMap.get(game.homeTeamId)?.displayName}__**`;
            }
            return `${teamMap.get(game.awayTeamId)?.displayName} ${game.awayScore} vs ${game.homeScore} ${teamMap.get(game.homeTeamId)?.displayName}`;
        }
    }).join("\n");
    const season = schedule[0].seasonIndex;
    return `# ${madden_league_types_1.MADDEN_SEASON + season} ${(0, madden_league_types_1.getMessageForWeek)(week)} Schedule\n${schedulesMessage}`;
}
async function getWeekSchedule(league, week, season) {
    if (season) {
        const seasonIndex = season < 100 ? season : season - madden_league_types_1.MADDEN_SEASON;
        return await madden_db_1.default.getWeekScheduleForSeason(league, week, seasonIndex);
    }
    else {
        return await madden_db_1.default.getLatestWeekSchedule(league, week);
    }
}
async function getLatestTeams(league) {
    return (await madden_db_1.default.getLatestTeams(league)).getLatestTeams();
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id } = command;
        if (!command.data.options) {
            throw new Error("schedule command not defined properly");
        }
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (!leagueSettings.commands.madden_league?.league_id) {
            throw new Error("Could not find a linked Madden league, link a league first");
        }
        const league = leagueSettings.commands.madden_league.league_id;
        const week = Number(command.data.options[0].value);
        if (week < 1 || week > 23 || week === 22) {
            throw new Error("Invalid week number. Valid weeks are week 1-18 and for playoffs: Wildcard = 19, Divisional = 20, Conference Championship = 21, Super Bowl = 23");
        }
        const season = command.data.options?.[1]?.value;
        const [schedule, teams] = await Promise.all([getWeekSchedule(league, week, season ? Number(season) : undefined), getLatestTeams(league)]);
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.createMessageResponse)(`${format(schedule, teams, week)}`));
    },
    commandDefinition() {
        return {
            name: "schedule",
            description: "Shows the schedule for the week and season",
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Integer,
                    name: "week",
                    description: "The week to get the schedule for",
                    required: true
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Integer,
                    name: "season",
                    description: "The season to get the schedule for",
                    required: false
                }
            ],
            type: v10_1.ApplicationCommandType.ChatInput,
        };
    }
};
//# sourceMappingURL=schedule.js.map