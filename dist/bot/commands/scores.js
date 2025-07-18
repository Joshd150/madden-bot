"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoresCommand = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../../database");
const EmbedBuilder_1 = require("../embeds/EmbedBuilder");
/**
 * Scores command - handles all game score and schedule functionality
 * This command allows users to view recent games, upcoming schedules,
 * and detailed game information with comprehensive statistics
 */
exports.scoresCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('scores')
        .setDescription('View game scores and schedules')
        .addSubcommand(subcommand => subcommand
        .setName('recent')
        .setDescription('Show recent game scores')
        .addIntegerOption(option => option
        .setName('count')
        .setDescription('Number of games to show (default: 5)')
        .setMinValue(1)
        .setMaxValue(15)))
        .addSubcommand(subcommand => subcommand
        .setName('schedule')
        .setDescription('Show upcoming games')
        .addIntegerOption(option => option
        .setName('week')
        .setDescription('Specific week to show (default: current week)')
        .setMinValue(1)
        .setMaxValue(18)))
        .addSubcommand(subcommand => subcommand
        .setName('team')
        .setDescription('Show games for a specific team')
        .addStringOption(option => option
        .setName('team')
        .setDescription('Team name or abbreviation')
        .setRequired(true)
        .setAutocomplete(true))
        .addBooleanOption(option => option
        .setName('upcoming')
        .setDescription('Show upcoming games instead of recent (default: false)')))
        .addSubcommand(subcommand => subcommand
        .setName('breakdown')
        .setDescription('Get detailed breakdown of a specific game')
        .addIntegerOption(option => option
        .setName('game_id')
        .setDescription('Game ID to analyze')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add a game result (Admin only)')
        .addStringOption(option => option
        .setName('home_team')
        .setDescription('Home team')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption(option => option
        .setName('away_team')
        .setDescription('Away team')
        .setRequired(true)
        .setAutocomplete(true))
        .addIntegerOption(option => option
        .setName('home_score')
        .setDescription('Home team score')
        .setRequired(true)
        .setMinValue(0))
        .addIntegerOption(option => option
        .setName('away_score')
        .setDescription('Away team score')
        .setRequired(true)
        .setMinValue(0))
        .addIntegerOption(option => option
        .setName('week')
        .setDescription('Week number')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(18))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        try {
            switch (subcommand) {
                case 'recent':
                    await handleRecentScores(interaction);
                    break;
                case 'schedule':
                    await handleSchedule(interaction);
                    break;
                case 'team':
                    await handleTeamGames(interaction);
                    break;
                case 'breakdown':
                    await handleGameBreakdown(interaction);
                    break;
                case 'add':
                    await handleAddGame(interaction);
                    break;
                default:
                    await interaction.reply({
                        embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Unknown subcommand')],
                        ephemeral: true
                    });
            }
        }
        catch (error) {
            console.error('Error in scores command:', error);
            await interaction.reply({
                embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('An error occurred while processing your request', 'Please try again later or contact an administrator')],
                ephemeral: true
            });
        }
    },
    // Autocomplete handler for team names
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'team' || focusedOption.name === 'home_team' || focusedOption.name === 'away_team') {
            const teams = await database_1.database.all('SELECT name, abbreviation FROM teams WHERE name LIKE ? OR abbreviation LIKE ? LIMIT 25', [`%${focusedOption.value}%`, `%${focusedOption.value}%`]);
            const choices = teams.map(team => ({
                name: `${team.name} (${team.abbreviation})`,
                value: team.name
            }));
            await interaction.respond(choices);
        }
    }
};
/**
 * Handles the 'recent' subcommand - shows recent completed games
 */
async function handleRecentScores(interaction) {
    const count = interaction.options.getInteger('count') || 5;
    // Query recent completed games with team information
    const games = await database_1.database.all(`
    SELECT 
      g.*,
      ht.name as home_team_name,
      ht.abbreviation as home_team_abbr,
      ht.logo_url as home_team_logo,
      ht.primary_color as home_team_color,
      at.name as away_team_name,
      at.abbreviation as away_team_abbr,
      at.logo_url as away_team_logo,
      at.primary_color as away_team_color
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    WHERE g.status = 'completed'
    ORDER BY g.game_date DESC
    LIMIT ?
  `, [count]);
    if (games.length === 0) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed('No Recent Games', 'There are no recent completed games to display.')],
            ephemeral: true
        });
        return;
    }
    // Create embeds for each game
    const embeds = [];
    for (const game of games) {
        const gameData = {
            homeTeam: {
                name: game.home_team_name,
                abbreviation: game.home_team_abbr,
                logoUrl: game.home_team_logo,
                color: game.home_team_color
            },
            awayTeam: {
                name: game.away_team_name,
                abbreviation: game.away_team_abbr,
                logoUrl: game.away_team_logo,
                color: game.away_team_color
            },
            homeScore: game.home_score,
            awayScore: game.away_score,
            gameDate: game.game_date,
            week: game.week,
            status: game.status
        };
        const embed = EmbedBuilder_1.CustomEmbedBuilder.createGameEmbed(gameData);
        // Add additional game information
        if (game.stats_json) {
            const stats = JSON.parse(game.stats_json);
            if (stats.summary) {
                embed.addFields({
                    name: '📊 Game Summary',
                    value: stats.summary,
                    inline: false
                });
            }
        }
        embeds.push(embed);
    }
    await interaction.reply({ embeds: embeds });
}
/**
 * Handles the 'schedule' subcommand - shows upcoming games
 */
async function handleSchedule(interaction) {
    const week = interaction.options.getInteger('week');
    let whereClause = "WHERE g.status = 'scheduled'";
    let params = [];
    if (week) {
        whereClause += " AND g.week = ?";
        params.push(week);
    }
    // Query upcoming games
    const games = await database_1.database.all(`
    SELECT 
      g.*,
      ht.name as home_team_name,
      ht.abbreviation as home_team_abbr,
      ht.logo_url as home_team_logo,
      at.name as away_team_name,
      at.abbreviation as away_team_abbr,
      at.logo_url as away_team_logo
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    ${whereClause}
    ORDER BY g.game_date ASC
    LIMIT 15
  `, params);
    if (games.length === 0) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed('No Scheduled Games', week ? `No games scheduled for week ${week}.` : 'No upcoming games scheduled.')],
            ephemeral: true
        });
        return;
    }
    // Group games by week for better organization
    const gamesByWeek = games.reduce((acc, game) => {
        if (!acc[game.week]) {
            acc[game.week] = [];
        }
        acc[game.week].push(game);
        return acc;
    }, {});
    const embeds = [];
    for (const [weekNum, weekGames] of Object.entries(gamesByWeek)) {
        const embed = EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed(`Week ${weekNum} Schedule`, `${weekGames.length} games scheduled`);
        let scheduleText = '';
        weekGames.forEach(game => {
            const gameDate = new Date(game.game_date);
            const dateStr = gameDate.toLocaleDateString();
            const timeStr = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            scheduleText += `**${game.away_team_abbr}** @ **${game.home_team_abbr}**\n`;
            scheduleText += `${dateStr} at ${timeStr}\n\n`;
        });
        embed.setDescription(scheduleText);
        embeds.push(embed);
    }
    await interaction.reply({ embeds: embeds });
}
/**
 * Handles the 'team' subcommand - shows games for a specific team
 */
async function handleTeamGames(interaction) {
    const teamName = interaction.options.getString('team', true);
    const showUpcoming = interaction.options.getBoolean('upcoming') || false;
    // Find the team
    const team = await database_1.database.get('SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?', [`%${teamName}%`, `%${teamName}%`]);
    if (!team) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Team Not Found', `Could not find a team matching "${teamName}"`)],
            ephemeral: true
        });
        return;
    }
    const status = showUpcoming ? 'scheduled' : 'completed';
    const orderBy = showUpcoming ? 'ASC' : 'DESC';
    // Get games for this team
    const games = await database_1.database.all(`
    SELECT 
      g.*,
      ht.name as home_team_name,
      ht.abbreviation as home_team_abbr,
      ht.logo_url as home_team_logo,
      at.name as away_team_name,
      at.abbreviation as away_team_abbr,
      at.logo_url as away_team_logo
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    WHERE (g.home_team_id = ? OR g.away_team_id = ?) AND g.status = ?
    ORDER BY g.game_date ${orderBy}
    LIMIT 10
  `, [team.id, team.id, status]);
    if (games.length === 0) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed('No Games Found', `${team.name} has no ${showUpcoming ? 'upcoming' : 'recent'} games.`)],
            ephemeral: true
        });
        return;
    }
    // Create team schedule embed
    const embed = EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed(`${team.name} ${showUpcoming ? 'Schedule' : 'Recent Games'}`, `${games.length} ${showUpcoming ? 'upcoming' : 'completed'} games`);
    embed.setThumbnail(team.logo_url);
    let gamesText = '';
    games.forEach(game => {
        const isHome = game.home_team_id === team.id;
        const opponent = isHome ? game.away_team_name : game.home_team_name;
        const opponentAbbr = isHome ? game.away_team_abbr : game.home_team_abbr;
        const location = isHome ? 'vs' : '@';
        const gameDate = new Date(game.game_date).toLocaleDateString();
        if (showUpcoming) {
            gamesText += `**Week ${game.week}** - ${location} ${opponentAbbr} (${gameDate})\n`;
        }
        else {
            const teamScore = isHome ? game.home_score : game.away_score;
            const oppScore = isHome ? game.away_score : game.home_score;
            const result = teamScore > oppScore ? 'W' : (teamScore < oppScore ? 'L' : 'T');
            gamesText += `**Week ${game.week}** - ${result} ${location} ${opponentAbbr} (${teamScore}-${oppScore})\n`;
        }
    });
    embed.setDescription(gamesText);
    await interaction.reply({ embeds: [embed] });
}
/**
 * Handles the 'breakdown' subcommand - shows detailed game analysis
 */
async function handleGameBreakdown(interaction) {
    const gameId = interaction.options.getInteger('game_id', true);
    // Get detailed game information
    const game = await database_1.database.get(`
    SELECT 
      g.*,
      ht.name as home_team_name,
      ht.abbreviation as home_team_abbr,
      ht.logo_url as home_team_logo,
      ht.primary_color as home_team_color,
      at.name as away_team_name,
      at.abbreviation as away_team_abbr,
      at.logo_url as away_team_logo,
      at.primary_color as away_team_color
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    WHERE g.id = ?
  `, [gameId]);
    if (!game) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Game Not Found', `Could not find a game with ID ${gameId}`)],
            ephemeral: true
        });
        return;
    }
    if (game.status !== 'completed') {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Game Not Completed', 'Detailed breakdowns are only available for completed games.')],
            ephemeral: true
        });
        return;
    }
    // Parse game statistics
    let stats = {};
    if (game.stats_json) {
        try {
            stats = JSON.parse(game.stats_json);
        }
        catch (error) {
            console.error('Error parsing game stats:', error);
        }
    }
    // Create game data object
    const gameData = {
        homeTeam: {
            name: game.home_team_name,
            abbreviation: game.home_team_abbr,
            logoUrl: game.home_team_logo,
            color: game.home_team_color
        },
        awayTeam: {
            name: game.away_team_name,
            abbreviation: game.away_team_abbr,
            logoUrl: game.away_team_logo,
            color: game.away_team_color
        },
        homeScore: game.home_score,
        awayScore: game.away_score,
        gameDate: game.game_date,
        week: game.week,
        status: game.status
    };
    // Create detailed breakdown embed
    const embed = EmbedBuilder_1.CustomEmbedBuilder.createGameBreakdownEmbed(gameData, stats);
    // Add game ID for reference
    embed.addFields({
        name: '🆔 Game ID',
        value: `${game.id}`,
        inline: true
    });
    await interaction.reply({ embeds: [embed] });
}
/**
 * Handles the 'add' subcommand - adds a new game result (admin only)
 */
async function handleAddGame(interaction) {
    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Permission Denied', 'You need administrator permissions to add game results.')],
            ephemeral: true
        });
        return;
    }
    const homeTeamName = interaction.options.getString('home_team', true);
    const awayTeamName = interaction.options.getString('away_team', true);
    const homeScore = interaction.options.getInteger('home_score', true);
    const awayScore = interaction.options.getInteger('away_score', true);
    const week = interaction.options.getInteger('week', true);
    // Find teams
    const homeTeam = await database_1.database.get('SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?', [`%${homeTeamName}%`, `%${homeTeamName}%`]);
    const awayTeam = await database_1.database.get('SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?', [`%${awayTeamName}%`, `%${awayTeamName}%`]);
    if (!homeTeam || !awayTeam) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Team Not Found', 'One or both teams could not be found.')],
            ephemeral: true
        });
        return;
    }
    if (homeTeam.id === awayTeam.id) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Invalid Game', 'A team cannot play against itself.')],
            ephemeral: true
        });
        return;
    }
    // Insert the game into the database
    const result = await database_1.database.run(`
    INSERT INTO games (home_team_id, away_team_id, home_score, away_score, week, status, game_date)
    VALUES (?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
  `, [homeTeam.id, awayTeam.id, homeScore, awayScore, week]);
    await interaction.reply({
        embeds: [EmbedBuilder_1.CustomEmbedBuilder.createSuccessEmbed('Game Result Added', `${awayTeam.name} ${awayScore} - ${homeScore} ${homeTeam.name} (Week ${week})`)]
    });
    // TODO: Trigger automated score posting to scores channel
    // This will be handled by the automation system
}
//# sourceMappingURL=scores.js.map