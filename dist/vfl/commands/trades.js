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
            throw new Error("Trades command not configured properly");
        }
        const subCommand = command.data.options[0];
        const subCommandName = subCommand.name;
        // Defer the response since we might need to do database queries
        (0, discord_utils_1.respond)(ctx, (0, discord_utils_1.deferMessage)());
        try {
            switch (subCommandName) {
                case 'recent':
                    await handleRecentTrades(client, token, guild_id);
                    break;
                case 'team':
                    await handleTeamTrades(client, token, guild_id, subCommand);
                    break;
                case 'player':
                    await handlePlayerTrades(client, token, guild_id, subCommand);
                    break;
                case 'add':
                    await handleAddTrade(client, token, guild_id, subCommand, command);
                    break;
                default:
                    await client.editOriginalInteraction(token, {
                        embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Unknown Command', `Unknown subcommand: ${subCommandName}`).build()]
                    });
            }
        }
        catch (error) {
            console.error('Error in trades command:', error);
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Command Failed', 'An error occurred while processing your request. Please try again later.').build()]
            });
        }
    },
    commandDefinition() {
        return {
            name: "trades",
            description: "View and manage trade information in the VFL",
            type: v10_1.ApplicationCommandType.ChatInput,
            options: [
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "recent",
                    description: "Show the most recent trades in the league",
                    options: []
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "team",
                    description: "Show all trades involving a specific team",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "team_name",
                            description: "Name of the team to search for",
                            required: true
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "player",
                    description: "Show all trades involving a specific player",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "player_name",
                            description: "Name of the player to search for",
                            required: true
                        }
                    ]
                },
                {
                    type: v10_1.ApplicationCommandOptionType.Subcommand,
                    name: "add",
                    description: "Add a new trade to the system (Admin only)",
                    options: [
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "from_team",
                            description: "Team trading away players",
                            required: true
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "to_team",
                            description: "Team receiving players",
                            required: true
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "players",
                            description: "Players involved (format: 'Player Name (Position), Player Name (Position)')",
                            required: true
                        },
                        {
                            type: v10_1.ApplicationCommandOptionType.String,
                            name: "description",
                            description: "Optional description or analysis of the trade",
                            required: false
                        }
                    ]
                }
            ]
        };
    }
};
/**
 * Shows the most recent trades in the league
 * This gives users a quick overview of recent trading activity
 */
async function handleRecentTrades(client, token, guildId) {
    try {
        // Query our Firestore database for recent trades
        // We're using the same database structure as the existing bot
        const tradesSnapshot = await firebase_1.default.collection('vfl_trades')
            .orderBy('tradeDate', 'desc')
            .limit(5)
            .get();
        if (tradesSnapshot.empty) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createInfoEmbed('No Recent Trades', 'There are no recent trades to display. The trade market has been quiet!').build()]
            });
            return;
        }
        // Create beautiful embeds for each trade
        const embeds = [];
        tradesSnapshot.docs.forEach(doc => {
            const trade = doc.data();
            const embed = embed_builder_1.VFLEmbedBuilder.createTradeEmbed(trade);
            // Add the trade date for context
            embed.addField('📅 Trade Date', trade.tradeDate.toDate().toLocaleDateString(), true);
            embeds.push(embed.build());
        });
        await client.editOriginalInteraction(token, { embeds });
    }
    catch (error) {
        console.error('Error fetching recent trades:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Database Error', 'Could not retrieve recent trades. Please try again later.').build()]
        });
    }
}
/**
 * Shows all trades involving a specific team
 * Great for seeing a team's trading history and activity
 */
async function handleTeamTrades(client, token, guildId, subCommand) {
    const teamName = subCommand.options?.[0]?.value;
    if (!teamName) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Missing Team Name', 'Please specify a team name to search for.').build()]
        });
        return;
    }
    try {
        // Search for trades involving this team (either as sender or receiver)
        const tradesSnapshot = await firebase_1.default.collection('vfl_trades')
            .where('fromTeamName', '==', teamName)
            .orderBy('tradeDate', 'desc')
            .limit(10)
            .get();
        const receivingTradesSnapshot = await firebase_1.default.collection('vfl_trades')
            .where('toTeamName', '==', teamName)
            .orderBy('tradeDate', 'desc')
            .limit(10)
            .get();
        // Combine and deduplicate the results
        const allTrades = new Map();
        [...tradesSnapshot.docs, ...receivingTradesSnapshot.docs].forEach(doc => {
            allTrades.set(doc.id, doc.data());
        });
        if (allTrades.size === 0) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createInfoEmbed('No Trades Found', `${teamName} hasn't been involved in any recent trades.`).build()]
            });
            return;
        }
        // Create a summary embed showing all the team's trades
        const embed = embed_builder_1.VFLEmbedBuilder.createInfoEmbed(`${teamName} Trade History`, `Found ${allTrades.size} recent trades involving ${teamName}`);
        let tradesList = '';
        Array.from(allTrades.values())
            .sort((a, b) => b.tradeDate.toDate().getTime() - a.tradeDate.toDate().getTime())
            .slice(0, 10)
            .forEach((trade) => {
            const date = trade.tradeDate.toDate().toLocaleDateString();
            const otherTeam = trade.fromTeamName === teamName ? trade.toTeamName : trade.fromTeamName;
            const direction = trade.fromTeamName === teamName ? 'to' : 'from';
            tradesList += `**${date}** - Trade ${direction} ${otherTeam}\n`;
        });
        embed.setDescription(tradesList);
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()]
        });
    }
    catch (error) {
        console.error('Error fetching team trades:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Search Error', 'Could not search for team trades. Please try again later.').build()]
        });
    }
}
/**
 * Shows all trades involving a specific player
 * Perfect for tracking a player's journey through different teams
 */
async function handlePlayerTrades(client, token, guildId, subCommand) {
    const playerName = subCommand.options?.[0]?.value;
    if (!playerName) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Missing Player Name', 'Please specify a player name to search for.').build()]
        });
        return;
    }
    try {
        // Search through all trades for ones involving this player
        // This is a bit more complex since player data is stored as an array
        const tradesSnapshot = await firebase_1.default.collection('vfl_trades')
            .orderBy('tradeDate', 'desc')
            .get();
        const playerTrades = [];
        tradesSnapshot.docs.forEach(doc => {
            const trade = doc.data();
            const hasPlayer = trade.players.some(player => player.name.toLowerCase().includes(playerName.toLowerCase()));
            if (hasPlayer) {
                playerTrades.push(trade);
            }
        });
        if (playerTrades.length === 0) {
            await client.editOriginalInteraction(token, {
                embeds: [embed_builder_1.VFLEmbedBuilder.createInfoEmbed('No Trades Found', `No trades found involving a player named "${playerName}".`).build()]
            });
            return;
        }
        // Create a player trade history embed
        const embed = embed_builder_1.VFLEmbedBuilder.createPlayerEmbed({
            name: playerName,
            position: 'Various', // We don't know the exact player details
            team: null
        });
        embed.setTitle(`👤 **${playerName} Trade History**`);
        let tradesText = '';
        playerTrades.slice(0, 10).forEach(trade => {
            const date = trade.tradeDate.toDate().toLocaleDateString();
            tradesText += `**${date}** - ${trade.fromTeamName} → ${trade.toTeamName}\n`;
        });
        embed.addField('📈 Trade History', tradesText, false);
        await client.editOriginalInteraction(token, {
            embeds: [embed.build()]
        });
    }
    catch (error) {
        console.error('Error fetching player trades:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Search Error', 'Could not search for player trades. Please try again later.').build()]
        });
    }
}
/**
 * Adds a new trade to the system (Admin only)
 * This is where the magic happens - new trades get added and automatically posted!
 */
async function handleAddTrade(client, token, guildId, subCommand, command) {
    // First, check if the user has permission to add trades
    // In a real implementation, you'd check for admin roles
    const hasPermission = true; // TODO: Implement proper permission checking
    if (!hasPermission) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Permission Denied', 'You need administrator permissions to add trades.').build()]
        });
        return;
    }
    // Extract the trade information from the command
    const fromTeam = subCommand.options?.find((opt) => opt.name === 'from_team')?.value;
    const toTeam = subCommand.options?.find((opt) => opt.name === 'to_team')?.value;
    const playersString = subCommand.options?.find((opt) => opt.name === 'players')?.value;
    const description = subCommand.options?.find((opt) => opt.name === 'description')?.value || '';
    if (!fromTeam || !toTeam || !playersString) {
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Missing Information', 'Please provide all required trade details: from team, to team, and players.').build()]
        });
        return;
    }
    try {
        // Parse the players string into individual player objects
        // Expected format: "Player Name (Position), Player Name (Position)"
        const players = playersString.split(',').map((playerStr) => {
            const trimmed = playerStr.trim();
            const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
                return {
                    name: match[1].trim(),
                    position: match[2].trim(),
                    fromTeam: fromTeam,
                    toTeam: toTeam
                };
            }
            else {
                return {
                    name: trimmed,
                    position: 'Unknown',
                    fromTeam: fromTeam,
                    toTeam: toTeam
                };
            }
        });
        // Create the trade object
        const tradeData = {
            fromTeamId: fromTeam.toLowerCase().replace(/\s+/g, '_'), // Simple ID generation
            toTeamId: toTeam.toLowerCase().replace(/\s+/g, '_'),
            fromTeamName: fromTeam,
            toTeamName: toTeam,
            players: players,
            tradeDate: new Date(),
            description: description,
            postedToDiscord: false
        };
        // Save the trade to Firestore
        const docRef = await firebase_1.default.collection('vfl_trades').add(tradeData);
        // Update the trade with its ID
        await docRef.update({ id: docRef.id });
        // Create a success embed
        const successEmbed = embed_builder_1.VFLEmbedBuilder.createSuccessEmbed('Trade Added Successfully', `Trade between ${fromTeam} and ${toTeam} has been recorded and will be posted to the trades channel.`);
        await client.editOriginalInteraction(token, {
            embeds: [successEmbed.build()]
        });
        // TODO: Trigger the automated trade posting system
        // This would post the trade to the designated trades channel
        await postTradeToChannel(client, guildId, { ...tradeData, id: docRef.id });
    }
    catch (error) {
        console.error('Error adding trade:', error);
        await client.editOriginalInteraction(token, {
            embeds: [embed_builder_1.VFLEmbedBuilder.createErrorEmbed('Database Error', 'Could not save the trade. Please try again later.').build()]
        });
    }
}
/**
 * Posts a trade to the designated trades channel
 * This is the automated system that keeps everyone informed of new trades
 */
async function postTradeToChannel(client, guildId, trade) {
    try {
        // Get the server configuration to find the trades channel
        const configDoc = await firebase_1.default.collection('vfl_config').doc(guildId).get();
        if (!configDoc.exists) {
            console.log('No VFL configuration found for guild:', guildId);
            return;
        }
        const config = configDoc.data();
        const tradesChannelId = config?.tradesChannelId;
        if (!tradesChannelId) {
            console.log('No trades channel configured for guild:', guildId);
            return;
        }
        // Create the trade embed for posting
        const embed = embed_builder_1.VFLEmbedBuilder.createTradeEmbed(trade);
        // Add additional context for the channel post
        embed.addField('📅 Trade Date', trade.tradeDate.toLocaleDateString(), true);
        if (trade.description) {
            embed.addField('📝 Details', trade.description, false);
        }
        // Post to the trades channel
        const message = await client.createMessage({ id: tradesChannelId, id_type: 'CHANNEL' }, '', []);
        // Update the trade record to mark it as posted
        if (trade.id) {
            await firebase_1.default.collection('vfl_trades').doc(trade.id).update({
                postedToDiscord: true,
                discordMessageId: message.id
            });
        }
        console.log(`Trade posted to channel ${tradesChannelId}:`, trade.id);
    }
    catch (error) {
        console.error('Error posting trade to channel:', error);
    }
}
//# sourceMappingURL=trades.js.map