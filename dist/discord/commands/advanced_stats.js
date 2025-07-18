"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../discord_utils");
const v10_1 = require("discord-api-types/v10");
const madden_db_1 = __importDefault(require("../../db/madden_db"));
const embed_builder_1 = require("../embeds/embed_builder");
const button_builder_1 = require("../components/button_builder");
const madden_league_types_1 = require("../../export/madden_league_types");
async function handleSalaryCap(client, token, leagueId, teamName) {
    try {
        const teams = await madden_db_1.default.getLatestTeams(leagueId);
        const standings = await madden_db_1.default.getLatestStandings(leagueId);
        let teamsToShow = teams.getLatestTeams();
        if (teamName) {
            teamsToShow = teamsToShow.filter(team => team.displayName.toLowerCase().includes(teamName.toLowerCase()) ||
                team.cityName.toLowerCase().includes(teamName.toLowerCase()) ||
                team.abbrName.toLowerCase().includes(teamName.toLowerCase()));
        }
        if (teamsToShow.length === 0) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.EmbedBuilder.error("Team Not Found", `No team found matching "${teamName}"`).build()]
            });
            return;
        }
        const embed = embed_builder_1.EmbedBuilder.madden("💰 Salary Cap Information", teamName ? `Salary cap details for ${teamsToShow[0].displayName}` : "League-wide salary cap overview");
        teamsToShow.slice(0, 10).forEach(team => {
            const standing = standings.find(s => s.teamId === team.teamId);
            if (standing) {
                const capUsed = standing.capSpent;
                const capAvailable = standing.capAvailable;
                const totalCap = capUsed + capAvailable;
                const capPercentage = capUsed / totalCap;
                embed.addField(`${team.displayName}`, `**Used:** ${(0, embed_builder_1.formatCurrency)(capUsed)} (${(0, embed_builder_1.formatPercentage)(capPercentage)})\n` +
                    `**Available:** ${(0, embed_builder_1.formatCurrency)(capAvailable)}\n` +
                    `**Total:** ${(0, embed_builder_1.formatCurrency)(totalCap)}\n` +
                    `${(0, embed_builder_1.createProgressBar)(capUsed, totalCap, 8)}`, true);
            }
        });
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()]
        });
    }
    catch (error) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.EmbedBuilder.error("Salary Cap Error", `Failed to retrieve salary cap data: ${error}`).build()]
        });
    }
}
async function handleLeagueLeaders(client, token, leagueId, statCategory) {
    try {
        const players = await madden_db_1.default.getLatestPlayers(leagueId);
        const teams = await madden_db_1.default.getLatestTeams(leagueId);
        // Get detailed stats for top players based on category
        let sortedPlayers = [];
        let statTitle = "";
        let statFormatter = (value) => value.toString();
        switch (statCategory.toLowerCase()) {
            case "overall":
                sortedPlayers = players.sort((a, b) => b.playerBestOvr - a.playerBestOvr);
                statTitle = "Overall Rating";
                break;
            case "speed":
                sortedPlayers = players.sort((a, b) => b.speedRating - a.speedRating);
                statTitle = "Speed Rating";
                break;
            case "strength":
                sortedPlayers = players.sort((a, b) => b.strengthRating - a.strengthRating);
                statTitle = "Strength Rating";
                break;
            case "awareness":
                sortedPlayers = players.sort((a, b) => b.awareRating - a.awareRating);
                statTitle = "Awareness Rating";
                break;
            case "salary":
                sortedPlayers = players.sort((a, b) => b.contractSalary - a.contractSalary);
                statTitle = "Contract Salary";
                statFormatter = (value) => (0, embed_builder_1.formatCurrency)(value);
                break;
            default:
                await client.editOriginalInteraction(token, {
                    embeds: [embed_builder_1.EmbedBuilder.error("Invalid Category", `Unknown stat category: ${statCategory}`).build()]
                });
                return;
        }
        const embed = embed_builder_1.EmbedBuilder.madden(`🏆 League Leaders - ${statTitle}`, `Top 10 players by ${statTitle.toLowerCase()}`);
        sortedPlayers.slice(0, 10).forEach((player, index) => {
            const team = teams.getTeamForId(player.teamId);
            let statValue;
            switch (statCategory.toLowerCase()) {
                case "overall":
                    statValue = player.playerBestOvr;
                    break;
                case "speed":
                    statValue = player.speedRating;
                    break;
                case "strength":
                    statValue = player.strengthRating;
                    break;
                case "awareness":
                    statValue = player.awareRating;
                    break;
                case "salary":
                    statValue = player.contractSalary;
                    break;
                default:
                    statValue = 0;
            }
            const medal = index < 3 ? ["🥇", "🥈", "🥉"][index] : `${index + 1}.`;
            embed.addField(`${medal} ${player.firstName} ${player.lastName}`, `**${player.position}** - ${team.displayName}\n` +
                `**${statTitle}:** ${statFormatter(statValue)}`, true);
        });
        const buttons = new button_builder_1.ActionRowBuilder()
            .addComponents(button_builder_1.ButtonBuilder.secondary("Overall", `league_leaders_overall_${leagueId}`).build(), button_builder_1.ButtonBuilder.secondary("Speed", `league_leaders_speed_${leagueId}`).build(), button_builder_1.ButtonBuilder.secondary("Strength", `league_leaders_strength_${leagueId}`).build(), button_builder_1.ButtonBuilder.secondary("Salary", `league_leaders_salary_${leagueId}`).build());
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()],
            components: [buttons.build()]
        });
    }
    catch (error) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.EmbedBuilder.error("League Leaders Error", `Failed to retrieve league leaders: ${error}`).build()]
        });
    }
}
async function handleFreeAgents(client, token, leagueId, position, limit = 20) {
    try {
        const freeAgents = await madden_db_1.default.getPlayers(leagueId, {
            teamId: 0,
            position: position
        }, limit);
        if (freeAgents.length === 0) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.EmbedBuilder.warning("No Free Agents", position ? `No free agents found at ${position} position` : "No free agents available").build()]
            });
            return;
        }
        const embed = embed_builder_1.EmbedBuilder.madden("🆓 Free Agents", position ? `Available ${position} players` : "Available free agents");
        freeAgents.slice(0, 15).forEach((player, index) => {
            embed.addField(`${player.firstName} ${player.lastName} (${player.position})`, `**Overall:** ${player.playerBestOvr} | **Age:** ${player.age}\n` +
                `**Desired Salary:** ${(0, embed_builder_1.formatCurrency)(player.desiredSalary)}\n` +
                `**Years Pro:** ${player.yearsPro}`, true);
        });
        if (freeAgents.length > 15) {
            embed.setFooter(`Showing 15 of ${freeAgents.length} free agents`);
        }
        // Add position filter buttons
        const positionButtons = new button_builder_1.ActionRowBuilder()
            .addComponents(button_builder_1.ButtonBuilder.secondary("QB", `free_agents_QB_${leagueId}`).build(), button_builder_1.ButtonBuilder.secondary("RB", `free_agents_HB_${leagueId}`).build(), button_builder_1.ButtonBuilder.secondary("WR", `free_agents_WR_${leagueId}`).build(), button_builder_1.ButtonBuilder.secondary("All", `free_agents_all_${leagueId}`).build());
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()],
            components: [positionButtons.build()]
        });
    }
    catch (error) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.EmbedBuilder.error("Free Agents Error", `Failed to retrieve free agents: ${error}`).build()]
        });
    }
}
exports.default = {
    async handleCommand(command, client, db, ctx) {
        const { guild_id, token } = command;
        if (!command.data.options) {
            throw new Error("Advanced stats command not configured properly");
        }
        const doc = await db.collection("league_settings").doc(guild_id).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        if (!leagueSettings?.commands?.madden_league?.league_id) {
            throw new Error("No Madden league linked. Setup Snallabot with your Madden league first.");
        }
        const leagueId = leagueSettings.commands.madden_league.league_id;
        const subCommand = command.data.options[0];
        const subCommandName = subCommand.name;
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
        switch (subCommandName) {
            case "salary-cap":
                const teamName = subCommand.options?.[0]?.value;
                await handleSalaryCap(client, token, leagueId, teamName);
                break;
            case "league-leaders":
                const statCategory = subCommand.options?.[0]?.value || "overall";
                await handleLeagueLeaders(client, token, leagueId, statCategory);
                break;
            case "free-agents":
                const position = subCommand.options?.[0]?.value;
                const limit = subCommand.options?.[1]?.value || 20;
                await handleFreeAgents(client, token, leagueId, position, limit);
                break;
            default:
                await client.editOriginalInteraction(token, {
                    embeds: [embed_builder_1.EmbedBuilder.error("Unknown Command", `Unknown subcommand: ${subCommandName}`).build()]
                });
        }
    },
    commandDefinition() {
        return {
            name: "advanced-stats",
            description: "Advanced league statistics and data analysis",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "salary-cap",
                    description: "View salary cap information for teams",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "team",
                            description: "Specific team to view (optional)",
                            required: false
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "league-leaders",
                    description: "View league leaders in various statistical categories",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "category",
                            description: "Statistical category to view leaders for",
                            required: false,
                            choices: [
                                { name: "Overall Rating", value: "overall" },
                                { name: "Speed", value: "speed" },
                                { name: "Strength", value: "strength" },
                                { name: "Awareness", value: "awareness" },
                                { name: "Contract Salary", value: "salary" }
                            ]
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "free-agents",
                    description: "View available free agents",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "position",
                            description: "Filter by position",
                            required: false,
                            choices: madden_league_types_1.POSITIONS.map(pos => ({ name: pos, value: pos }))
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.Integer,
                            name: "limit",
                            description: "Number of players to show (default: 20)",
                            required: false,
                            min_value: 5,
                            max_value: 50
                        }
                    ]
                }
            ]
        };
    }
};
//# sourceMappingURL=advanced_stats.js.map