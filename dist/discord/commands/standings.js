"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const madden_db_1 = __importDefault(require("../../db/madden_db"));
const madden_league_types_1 = require("../../export/madden_league_types");
function formatStandings(standings) {
    const standingsMessageFull = standings.map(standing => {
        const record = (0, madden_league_types_1.formatRecord)(standing);
        const teamRank = `Net Points: ${standing.netPts}\nPoints For: ${standing.ptsFor} (${standing.ptsForRank})\nPoints Against: ${standing.ptsAgainst} (${standing.ptsAgainstRank})\nTurnover Diff: ${standing.tODiff}`;
        const offenseRank = `### Offense Rank\nTotal: ${standing.offTotalYds}yds (${standing.offTotalYdsRank})\nPassing: ${standing.offPassYds}yds (${standing.offPassYdsRank})\nRushing: ${standing.offRushYds}yds (${standing.offRushYdsRank})`;
        const defensiveRank = `### Defense Rank\nTotal: ${standing.defTotalYds}yds (${standing.defTotalYdsRank})\nPassing: ${standing.defPassYds}yds (${standing.defPassYdsRank})\nRushing: ${standing.defRushYds}yds (${standing.defRushYdsRank})`;
        return `### ${standing.rank}. ${standing.teamName} (${record})\n${teamRank}\n${offenseRank}\n${defensiveRank}`;
    }).join("\n");
    const standingsMessageLight = standings.map(standing => {
        const record = (0, madden_league_types_1.formatRecord)(standing);
        const teamRank = `Net Points: ${standing.netPts}\nOffense Yards: ${standing.offTotalYds} (${standing.offTotalYdsRank})\nDefense: ${standing.defTotalYds} (${standing.defTotalYdsRank})\nTurnover Diff: ${standing.tODiff}`;
        return `### ${standing.rank}. ${standing.teamName} (${record})\n${teamRank}`;
    }).join("\n");
    const standingsMessageBare = standings.map(standing => {
        const record = (0, madden_league_types_1.formatRecord)(standing);
        return `### ${standing.rank}. ${standing.teamName} (${record})`;
    }).join("\n");
    return [standingsMessageFull, standingsMessageLight, standingsMessageBare].filter(s => s.length < 2000)[0];
}
async function handleCommand(client, token, league, subCommand, top) {
    try {
        const standings = await madden_db_1.default.getLatestStandings(league);
        const standingsToFormat = (() => {
            if (subCommand === "nfl") {
                return standings;
            }
            else if (subCommand === "afc") {
                return standings.filter(s => s.conferenceName.toLowerCase() === "afc");
            }
            else if (subCommand === "nfc") {
                return standings.filter(s => s.conferenceName.toLowerCase() === "nfc");
            }
            throw new Error("unknown conference " + subCommand);
        })();
        if (!standingsToFormat) {
            throw new Error("no standings");
        }
        const message = formatStandings(standingsToFormat.sort((s1, s2) => s1.rank - s2.rank).slice(0, top));
        await client.editOriginalInteraction(token, {
            content: message
        });
    }
    catch (e) {
        await client.editOriginalInteraction(token, {
            content: "Standings failed: Error: " + e
        });
    }
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id, token } = command;
        if (!command.data.options) {
            throw new Error("game channels command not defined properly");
        }
        const options = command.data.options;
        const standingsCommand = options[0];
        const subCommand = standingsCommand.name;
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (!leagueSettings?.commands?.madden_league?.league_id) {
            throw new Error("No madden league linked. Setup snallabot with your Madden league first");
        }
        const league = leagueSettings.commands.madden_league.league_id;
        const top = Number(standingsCommand?.options?.[0] ? standingsCommand.options[0].value : 32);
        if (standingsCommand?.options?.[0]) {
        }
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
        handleCommand(client, token, league, subCommand, top);
    },
    commandDefinition() {
        return {
            name: "standings",
            description: "display the current team standings",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "nfl",
                    description: "standings for the entire league",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "top",
                            description: "get only the top teams",
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "nfc",
                    description: "standings for the nfc",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "top",
                            description: "get only the top teams",
                            required: false,
                        },
                    ],
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "afc",
                    description: "standings for the afc",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "top",
                            description: "get only the top teams",
                            required: false,
                        },
                    ],
                }
            ]
        };
    }
};
//# sourceMappingURL=standings.js.map