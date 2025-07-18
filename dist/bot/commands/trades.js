"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradesCommand = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../../database");
const EmbedBuilder_1 = require("../embeds/EmbedBuilder");
/**
 * Trades command - handles all trade-related functionality
 * This command allows users to view recent trades, search trade history,
 * and get detailed information about specific trades
 */
exports.tradesCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('trades')
        .setDescription('View and manage trade information')
        .addSubcommand(subcommand => subcommand
        .setName('recent')
        .setDescription('Show the most recent trades')
        .addIntegerOption(option => option
        .setName('count')
        .setDescription('Number of trades to show (default: 5)')
        .setMinValue(1)
        .setMaxValue(20)))
        .addSubcommand(subcommand => subcommand
        .setName('team')
        .setDescription('Show trades for a specific team')
        .addStringOption(option => option
        .setName('team')
        .setDescription('Team name or abbreviation')
        .setRequired(true)
        .setAutocomplete(true)))
        .addSubcommand(subcommand => subcommand
        .setName('player')
        .setDescription('Show trades involving a specific player')
        .addStringOption(option => option
        .setName('player')
        .setDescription('Player name')
        .setRequired(true)
        .setAutocomplete(true)))
        .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Add a new trade (Admin only)')
        .addStringOption(option => option
        .setName('from_team')
        .setDescription('Team trading away players')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption(option => option
        .setName('to_team')
        .setDescription('Team receiving players')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption(option => option
        .setName('players')
        .setDescription('Players involved (comma-separated)')
        .setRequired(true))
        .addStringOption(option => option
        .setName('description')
        .setDescription('Trade description or details'))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        try {
            switch (subcommand) {
                case 'recent':
                    await handleRecentTrades(interaction);
                    break;
                case 'team':
                    await handleTeamTrades(interaction);
                    break;
                case 'player':
                    await handlePlayerTrades(interaction);
                    break;
                case 'add':
                    await handleAddTrade(interaction);
                    break;
                default:
                    await interaction.reply({
                        embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Unknown subcommand')],
                        ephemeral: true
                    });
            }
        }
        catch (error) {
            console.error('Error in trades command:', error);
            await interaction.reply({
                embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('An error occurred while processing your request', 'Please try again later or contact an administrator')],
                ephemeral: true
            });
        }
    },
    // Autocomplete handler for team and player names
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'team') {
            // Get teams matching the user's input
            const teams = await database_1.database.all('SELECT name, abbreviation FROM teams WHERE name LIKE ? OR abbreviation LIKE ? LIMIT 25', [`%${focusedOption.value}%`, `%${focusedOption.value}%`]);
            const choices = teams.map(team => ({
                name: `${team.name} (${team.abbreviation})`,
                value: team.name
            }));
            await interaction.respond(choices);
        }
        else if (focusedOption.name === 'player') {
            // Get players matching the user's input
            const players = await database_1.database.all('SELECT name, position FROM players WHERE name LIKE ? LIMIT 25', [`%${focusedOption.value}%`]);
            const choices = players.map(player => ({
                name: `${player.name} (${player.position})`,
                value: player.name
            }));
            await interaction.respond(choices);
        }
    }
};
/**
 * Handles the 'recent' subcommand - shows the most recent trades
 */
async function handleRecentTrades(interaction) {
    const count = interaction.options.getInteger('count') || 5;
    // Query recent trades with team information
    const trades = await database_1.database.all(`
    SELECT 
      t.*,
      ft.name as from_team_name,
      ft.abbreviation as from_team_abbr,
      ft.logo_url as from_team_logo,
      tt.name as to_team_name,
      tt.abbreviation as to_team_abbr,
      tt.logo_url as to_team_logo
    FROM trades t
    JOIN teams ft ON t.from_team_id = ft.id
    JOIN teams tt ON t.to_team_id = tt.id
    ORDER BY t.trade_date DESC
    LIMIT ?
  `, [count]);
    if (trades.length === 0) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed('No Trades Found', 'There are no recent trades to display.')],
            ephemeral: true
        });
        return;
    }
    // Create embeds for each trade (Discord has a limit of 10 embeds per message)
    const embeds = [];
    for (const trade of trades.slice(0, 10)) {
        // Parse player IDs and get player information
        const playerIds = JSON.parse(trade.player_ids || '[]');
        const players = [];
        for (const playerId of playerIds) {
            const player = await database_1.database.get('SELECT name, position FROM players WHERE id = ?', [playerId]);
            if (player) {
                players.push({
                    name: player.name,
                    position: player.position,
                    fromTeam: trade.from_team_abbr,
                    toTeam: trade.to_team_abbr
                });
            }
        }
        // Create trade object for embed
        const tradeData = {
            fromTeam: {
                name: trade.from_team_name,
                logoUrl: trade.from_team_logo
            },
            toTeam: {
                name: trade.to_team_name,
                logoUrl: trade.to_team_logo
            },
            players: players,
            draftPicks: JSON.parse(trade.draft_picks || '[]'),
            analysis: trade.description,
            date: trade.trade_date
        };
        const embed = EmbedBuilder_1.CustomEmbedBuilder.createTradeEmbed(tradeData);
        embed.addFields({
            name: '📅 Trade Date',
            value: new Date(trade.trade_date).toLocaleDateString(),
            inline: true
        });
        embeds.push(embed);
    }
    await interaction.reply({ embeds: embeds });
}
/**
 * Handles the 'team' subcommand - shows trades for a specific team
 */
async function handleTeamTrades(interaction) {
    const teamName = interaction.options.getString('team', true);
    // Find the team
    const team = await database_1.database.get('SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?', [`%${teamName}%`, `%${teamName}%`]);
    if (!team) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Team Not Found', `Could not find a team matching "${teamName}"`)],
            ephemeral: true
        });
        return;
    }
    // Get trades involving this team
    const trades = await database_1.database.all(`
    SELECT 
      t.*,
      ft.name as from_team_name,
      ft.abbreviation as from_team_abbr,
      tt.name as to_team_name,
      tt.abbreviation as to_team_abbr
    FROM trades t
    JOIN teams ft ON t.from_team_id = ft.id
    JOIN teams tt ON t.to_team_id = tt.id
    WHERE t.from_team_id = ? OR t.to_team_id = ?
    ORDER BY t.trade_date DESC
    LIMIT 10
  `, [team.id, team.id]);
    if (trades.length === 0) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed('No Trades Found', `${team.name} has no recent trades.`)],
            ephemeral: true
        });
        return;
    }
    // Create a summary embed
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#ff6b35')
        .setTitle(`🔄 **${team.name} Trade History**`)
        .setThumbnail(team.logo_url)
        .setTimestamp()
        .setFooter({ text: 'Sports Trading Hub' });
    let description = '';
    for (const trade of trades) {
        const otherTeam = trade.from_team_id === team.id ? trade.to_team_name : trade.from_team_name;
        const direction = trade.from_team_id === team.id ? 'to' : 'from';
        const date = new Date(trade.trade_date).toLocaleDateString();
        description += `**${date}** - Trade ${direction} ${otherTeam}\n`;
    }
    embed.setDescription(description);
    await interaction.reply({ embeds: [embed] });
}
/**
 * Handles the 'player' subcommand - shows trades involving a specific player
 */
async function handlePlayerTrades(interaction) {
    const playerName = interaction.options.getString('player', true);
    // Find the player
    const player = await database_1.database.get('SELECT * FROM players WHERE name LIKE ?', [`%${playerName}%`]);
    if (!player) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Player Not Found', `Could not find a player matching "${playerName}"`)],
            ephemeral: true
        });
        return;
    }
    // Find trades involving this player
    const trades = await database_1.database.all(`
    SELECT 
      t.*,
      ft.name as from_team_name,
      ft.abbreviation as from_team_abbr,
      tt.name as to_team_name,
      tt.abbreviation as to_team_abbr
    FROM trades t
    JOIN teams ft ON t.from_team_id = ft.id
    JOIN teams tt ON t.to_team_id = tt.id
    WHERE t.player_ids LIKE ?
    ORDER BY t.trade_date DESC
  `, [`%"${player.id}"%`]);
    if (trades.length === 0) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createInfoEmbed('No Trades Found', `${player.name} has not been involved in any recent trades.`)],
            ephemeral: true
        });
        return;
    }
    // Create player trade history embed
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('#9932cc')
        .setTitle(`👤 **${player.name} Trade History**`)
        .setTimestamp()
        .setFooter({ text: 'Sports Trading Hub' });
    let description = `**Position:** ${player.position}\n\n**Trade History:**\n`;
    for (const trade of trades) {
        const date = new Date(trade.trade_date).toLocaleDateString();
        description += `**${date}** - ${trade.from_team_name} → ${trade.to_team_name}\n`;
    }
    embed.setDescription(description);
    await interaction.reply({ embeds: [embed] });
}
/**
 * Handles the 'add' subcommand - adds a new trade (admin only)
 */
async function handleAddTrade(interaction) {
    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Permission Denied', 'You need administrator permissions to add trades.')],
            ephemeral: true
        });
        return;
    }
    const fromTeamName = interaction.options.getString('from_team', true);
    const toTeamName = interaction.options.getString('to_team', true);
    const playersString = interaction.options.getString('players', true);
    const description = interaction.options.getString('description') || '';
    // Find teams
    const fromTeam = await database_1.database.get('SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?', [`%${fromTeamName}%`, `%${fromTeamName}%`]);
    const toTeam = await database_1.database.get('SELECT * FROM teams WHERE name LIKE ? OR abbreviation LIKE ?', [`%${toTeamName}%`, `%${toTeamName}%`]);
    if (!fromTeam || !toTeam) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Team Not Found', 'One or both teams could not be found.')],
            ephemeral: true
        });
        return;
    }
    // Parse player names and find player IDs
    const playerNames = playersString.split(',').map(name => name.trim());
    const playerIds = [];
    for (const playerName of playerNames) {
        const player = await database_1.database.get('SELECT id FROM players WHERE name LIKE ?', [`%${playerName}%`]);
        if (player) {
            playerIds.push(player.id);
        }
    }
    if (playerIds.length === 0) {
        await interaction.reply({
            embeds: [EmbedBuilder_1.CustomEmbedBuilder.createErrorEmbed('Players Not Found', 'Could not find any of the specified players.')],
            ephemeral: true
        });
        return;
    }
    // Insert the trade into the database
    await database_1.database.run(`
    INSERT INTO trades (from_team_id, to_team_id, player_ids, description, trade_date)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [fromTeam.id, toTeam.id, JSON.stringify(playerIds), description]);
    await interaction.reply({
        embeds: [EmbedBuilder_1.CustomEmbedBuilder.createSuccessEmbed('Trade Added Successfully', `Trade between ${fromTeam.name} and ${toTeam.name} has been recorded.`)]
    });
    // TODO: Trigger automated trade posting to trades channel
    // This will be handled by the automation system
}
//# sourceMappingURL=trades.js.map