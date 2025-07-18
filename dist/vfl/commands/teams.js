"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_utils_1 = require("../../discord/discord_utils");
const v10_1 = require("discord-api-types/v10");
const embed_builder_1 = require("../embeds/embed_builder");
const firebase_1 = __importDefault(require("../../db/firebase"));
exports.default = {
    async handleCommand(command, client, firestore, ctx) {
        const { guild_id, token } = command;
        if (!command.data.options) {
            throw new Error("Teams command not configured properly");
        }
        const subCommand = command.data.options[0];
        const subCommandName = subCommand.name;
        // Defer response for database operations
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
        try {
            switch (subCommandName) {
                case 'list':
                    await handleTeamsList(client, token, guild_id);
                    break;
                case 'info':
                    await handleTeamInfo(client, token, guild_id, subCommand);
                    break;
                case 'roster':
                    await handleTeamRoster(client, token, guild_id, subCommand);
                    break;
                case 'stats':
                    await handleTeamStats(client, token, guild_id, subCommand);
                    break;
                case 'standings':
                    await handleStandings(client, token, guild_id, subCommand);
                    break;
                default:
                    await client.editOriginalInteraction(token, {
                        embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Unknown Command', `Unknown subcommand: ${subCommandName}`).build()]
                    });
            }
        }
        catch (error) {
            console.error('Error in teams command:', error);
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Command Failed', 'An error occurred while processing your request. Please try again later.').build()]
            });
        }
    },
    commandDefinition() {
        return {
            name: "teams",
            description: "View team information, rosters, and statistics",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "list",
                    description: "Show all teams in the league",
                    options: []
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "info",
                    description: "Get detailed information about a specific team",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "team_name",
                            description: "Name of the team",
                            required: true
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "roster",
                    description: "View a team's current roster",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "team_name",
                            description: "Name of the team",
                            required: true
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "stats",
                    description: "View team statistics and performance metrics",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "team_name",
                            description: "Name of the team",
                            required: true
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "standings",
                    description: "View league standings",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "conference",
                            description: "Filter by conference (optional)",
                            required: false,
                            choices: [
                                { name: "AFC", value: "AFC" },
                                { name: "NFC", value: "NFC" }
                            ]
                        }
                    ]
                }
            ]
        };
    }
};
/**
 * Shows a complete list of all teams in the league
 * Great for getting an overview of who's playing this season
 */
async function handleTeamsList(client, token, guildId) {
    try {
        // Get all teams from our database
        const teamsSnapshot = await firebase_1.default.collection('vfl_teams')
            .orderBy('conference')
            .orderBy('division')
            .orderBy('name')
            .get();
        if (teamsSnapshot.empty) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createInfoEmbed('No Teams Found', 'No teams are currently registered in the league.').build()]
            });
            return;
        }
        // Group teams by conference and division
        const teamsByConference = new Map();
        teamsSnapshot.docs.forEach(doc => {
            const team = doc.data();
            const conference = team.conference || 'Unknown';
            if (!teamsByConference.has(conference)) {
                teamsByConference.set(conference, new Map());
            }
            const division = team.division || 'Unknown';
            if (!teamsByConference.get(conference).has(division)) {
                teamsByConference.get(conference).set(division, []);
            }
            teamsByConference.get(conference).get(division).push(team);
        });
        // Create embeds for each conference
        const embeds = [];
        for (const [conference, divisions] of teamsByConference) {
            const embed = embed_builder_1.VFLEmbedBuilder.createInfoEmbed(`🏈 ${conference} Conference Teams`, `Teams organized by division`);
            for (const [division, teams] of divisions) {
                let divisionText = '';
                teams.forEach((team) => {
                    const record = team.record
                        ? ` (${team.record.wins}-${team.record.losses}${team.record.ties ? `-${team.record.ties}` : ''})`
                        : '';
                    divisionText += `• **${team.city} ${team.name}**${record}\n`;
                });
                embed.addField(`${division} Division`, divisionText, true);
            }
            embeds.push(embed.build());
        }
        await client.editOriginalInteraction(token, { embeds });
    }
    catch (error) {
        console.error('Error fetching teams list:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Database Error', 'Could not retrieve teams list. Please try again later.').build()]
        });
    }
}
/**
 * Shows detailed information about a specific team
 * This is like opening a team's Wikipedia page - comprehensive and informative
 */
async function handleTeamInfo(client, token, guildId, subCommand) {
    const teamName = subCommand.options?.find((opt) => opt.name === 'team_name')?.value;
    if (!teamName) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Missing Team Name', 'Please specify a team name.').build()]
        });
        return;
    }
    try {
        // Search for the team (case-insensitive)
        const teamsSnapshot = await firebase_1.default.collection('vfl_teams')
            .where('name', '>=', teamName)
            .where('name', '<=', teamName + '\uf8ff')
            .limit(1)
            .get();
        if (teamsSnapshot.empty) {
            // Try searching by city name as well
            const citySnapshot = await firebase_1.default.collection('vfl_teams')
                .where('city', '>=', teamName)
                .where('city', '<=', teamName + '\uf8ff')
                .limit(1)
                .get();
            if (citySnapshot.empty) {
                await client.editOriginalInteraction(token, {
                    embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Team Not Found', `Could not find a team matching "${teamName}". Try using the full team name.`).build()]
                });
                return;
            }
        }
        const teamDoc = teamsSnapshot.empty ? teamsSnapshot.docs[0] : teamsSnapshot.docs[0];
        const team = teamDoc.data();
        // Get recent games for this team
        const recentGamesSnapshot = await firebase_1.default.collection('vfl_games')
            .where('homeTeamName', '==', team.name)
            .orderBy('gameDate', 'desc')
            .limit(3)
            .get();
        const awayGamesSnapshot = await firebase_1.default.collection('vfl_games')
            .where('awayTeamName', '==', team.name)
            .orderBy('gameDate', 'desc')
            .limit(3)
            .get();
        // Combine recent games
        const allRecentGames = [];
        [...recentGamesSnapshot.docs, ...awayGamesSnapshot.docs].forEach(doc => {
            allRecentGames.push(doc.data());
        });
        // Sort by date and take the most recent
        const recentGames = allRecentGames
            .sort((a, b) => b.gameDate.toDate().getTime() - a.gameDate.toDate().getTime())
            .slice(0, 5);
        // Create the comprehensive team embed
        const embed = embed_builder_1.VFLEmbedBuilder.createTeamEmbed({
            ...team,
            recentGames: recentGames.map((game) => {
                const isHome = game.homeTeamName === team.name;
                const opponent = isHome ? game.awayTeamName : game.homeTeamName;
                const teamScore = isHome ? game.homeScore : game.awayScore;
                const oppScore = isHome ? game.awayScore : game.homeScore;
                return {
                    opponent,
                    score: `${teamScore}-${oppScore}`,
                    homeTeamId: isHome ? team.id : null
                };
            })
        });
        // Add coaching staff if available
        if (team.coachName) {
            embed.addField('👨‍💼 Head Coach', team.coachName, true);
        }
        // Add home venue
        if (team.homeVenue) {
            embed.addField('🏟️ Home Venue', team.homeVenue, true);
        }
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()]
        });
    }
    catch (error) {
        console.error('Error fetching team info:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Search Error', 'Could not retrieve team information. Please try again later.').build()]
        });
    }
}
/**
 * Shows a team's current roster
 * Perfect for checking out who's on your favorite team
 */
async function handleTeamRoster(client, token, guildId, subCommand) {
    const teamName = subCommand.options?.find((opt) => opt.name === 'team_name')?.value;
    if (!teamName) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Missing Team Name', 'Please specify a team name.').build()]
        });
        return;
    }
    try {
        // First, find the team
        const teamsSnapshot = await firebase_1.default.collection('vfl_teams')
            .where('name', '>=', teamName)
            .where('name', '<=', teamName + '\uf8ff')
            .limit(1)
            .get();
        if (teamsSnapshot.empty) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Team Not Found', `Could not find a team matching "${teamName}".`).build()]
            });
            return;
        }
        const team = teamsSnapshot.docs[0].data();
        // Get the team's roster
        const rosterSnapshot = await firebase_1.default.collection('vfl_players')
            .where('teamId', '==', teamsSnapshot.docs[0].id)
            .orderBy('position')
            .orderBy('name')
            .get();
        if (rosterSnapshot.empty) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createInfoEmbed('No Roster Data', `No roster information available for ${team.name}.`).build()]
            });
            return;
        }
        // Group players by position
        const playersByPosition = new Map();
        rosterSnapshot.docs.forEach(doc => {
            const player = doc.data();
            const position = player.position || 'Unknown';
            if (!playersByPosition.has(position)) {
                playersByPosition.set(position, []);
            }
            playersByPosition.get(position).push(player);
        });
        // Create the roster embed
        const embed = embed_builder_1.VFLEmbedBuilder.createTeamEmbed(team);
        embed.setTitle(`👥 **${team.city} ${team.name} Roster**`);
        embed.setDescription(`Current roster organized by position`);
        // Add players by position group
        const positionOrder = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P'];
        positionOrder.forEach(position => {
            if (playersByPosition.has(position)) {
                const players = playersByPosition.get(position);
                let positionText = '';
                players.slice(0, 10).forEach((player) => {
                    const jersey = player.jerseyNumber ? `#${player.jerseyNumber}` : '';
                    positionText += `${jersey} **${player.name}**\n`;
                });
                if (positionText) {
                    embed.addField(`${position} (${players.length})`, positionText, true);
                }
            }
        });
        // Add any remaining positions not in our standard order
        for (const [position, players] of playersByPosition) {
            if (!positionOrder.includes(position)) {
                let positionText = '';
                players.slice(0, 10).forEach((player) => {
                    const jersey = player.jerseyNumber ? `#${player.jerseyNumber}` : '';
                    positionText += `${jersey} **${player.name}**\n`;
                });
                if (positionText) {
                    embed.addField(`${position} (${players.length})`, positionText, true);
                }
            }
        }
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()]
        });
    }
    catch (error) {
        console.error('Error fetching team roster:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Roster Error', 'Could not retrieve team roster. Please try again later.').build()]
        });
    }
}
/**
 * Shows detailed team statistics
 * For the stat nerds who want to dive deep into the numbers
 */
async function handleTeamStats(client, token, guildId, subCommand) {
    const teamName = subCommand.options?.find((opt) => opt.name === 'team_name')?.value;
    if (!teamName) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Missing Team Name', 'Please specify a team name.').build()]
        });
        return;
    }
    try {
        // Find the team and get their stats
        const teamsSnapshot = await firebase_1.default.collection('vfl_teams')
            .where('name', '>=', teamName)
            .where('name', '<=', teamName + '\uf8ff')
            .limit(1)
            .get();
        if (teamsSnapshot.empty) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Team Not Found', `Could not find a team matching "${teamName}".`).build()]
            });
            return;
        }
        const team = teamsSnapshot.docs[0].data();
        // Create a comprehensive stats embed
        const embed = embed_builder_1.VFLEmbedBuilder.createTeamEmbed(team);
        embed.setTitle(`📊 **${team.city} ${team.name} Statistics**`);
        // Current record and standing
        if (team.record) {
            const winPct = (team.record.wins / (team.record.wins + team.record.losses + team.record.ties) * 100).toFixed(1);
            embed.addField('📈 Current Record', `${team.record.wins}-${team.record.losses}${team.record.ties ? `-${team.record.ties}` : ''} (${winPct}%)`, true);
        }
        // Offensive statistics
        if (team.stats) {
            let offenseText = '';
            if (team.stats.pointsFor)
                offenseText += `**Points Scored:** ${team.stats.pointsFor}\n`;
            if (team.stats.totalYards)
                offenseText += `**Total Yards:** ${team.stats.totalYards.toLocaleString()}\n`;
            if (team.stats.passingYards)
                offenseText += `**Passing Yards:** ${team.stats.passingYards.toLocaleString()}\n`;
            if (team.stats.rushingYards)
                offenseText += `**Rushing Yards:** ${team.stats.rushingYards.toLocaleString()}\n`;
            if (offenseText) {
                embed.addField('⚡ Offensive Stats', offenseText, true);
            }
            // Defensive statistics
            let defenseText = '';
            if (team.stats.pointsAgainst)
                defenseText += `**Points Allowed:** ${team.stats.pointsAgainst}\n`;
            if (team.stats.yardsAllowed)
                defenseText += `**Yards Allowed:** ${team.stats.yardsAllowed.toLocaleString()}\n`;
            if (team.stats.sacks)
                defenseText += `**Sacks:** ${team.stats.sacks}\n`;
            if (team.stats.interceptions)
                defenseText += `**Interceptions:** ${team.stats.interceptions}\n`;
            if (defenseText) {
                embed.addField('🛡️ Defensive Stats', defenseText, true);
            }
            // Calculate and show point differential
            if (team.stats.pointsFor && team.stats.pointsAgainst) {
                const differential = team.stats.pointsFor - team.stats.pointsAgainst;
                const diffText = differential > 0 ? `+${differential}` : `${differential}`;
                embed.addField('📊 Point Differential', diffText, true);
            }
        }
        // Playoff status if available
        if (team.playoffStatus) {
            embed.addField('🏆 Playoff Status', team.playoffStatus, true);
        }
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()]
        });
    }
    catch (error) {
        console.error('Error fetching team stats:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Stats Error', 'Could not retrieve team statistics. Please try again later.').build()]
        });
    }
}
/**
 * Shows league standings
 * The classic standings table that every sports fan loves to check
 */
async function handleStandings(client, token, guildId, subCommand) {
    const conference = subCommand.options?.find((opt) => opt.name === 'conference')?.value;
    try {
        let query = firebase_1.default.collection('vfl_teams');
        // Filter by conference if specified
        if (conference) {
            query = query.where('conference', '==', conference);
        }
        const teamsSnapshot = await query.get();
        if (teamsSnapshot.empty) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createInfoEmbed('No Teams Found', conference ? `No teams found in the ${conference} conference.` : 'No teams found in the league.').build()]
            });
            return;
        }
        // Convert to array and sort by record
        const teams = teamsSnapshot.docs.map(doc => doc.data()).filter(team => team.record);
        teams.sort((a, b) => {
            // Sort by wins first
            if (a.record.wins !== b.record.wins) {
                return b.record.wins - a.record.wins;
            }
            // Then by win percentage
            const aWinPct = a.record.wins / (a.record.wins + a.record.losses + a.record.ties);
            const bWinPct = b.record.wins / (b.record.wins + b.record.losses + b.record.ties);
            if (aWinPct !== bWinPct) {
                return bWinPct - aWinPct;
            }
            // Finally by point differential
            const aDiff = (a.stats?.pointsFor || 0) - (a.stats?.pointsAgainst || 0);
            const bDiff = (b.stats?.pointsFor || 0) - (b.stats?.pointsAgainst || 0);
            return bDiff - aDiff;
        });
        // Create the standings embed
        const embed = embed_builder_1.VFLEmbedBuilder.createStandingsEmbed(teams, conference);
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()]
        });
    }
    catch (error) {
        console.error('Error fetching standings:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Standings Error', 'Could not retrieve league standings. Please try again later.').build()]
        });
    }
}
//# sourceMappingURL=teams.js.map