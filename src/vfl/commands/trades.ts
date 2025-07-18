import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../../discord/commands_handler"
import { respond, createMessageResponse, DiscordClient, deferMessage } from "../../discord/discord_utils"
import { APIApplicationCommandInteractionDataStringOption, APIApplicationCommandInteractionDataSubcommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Firestore } from "firebase-admin/firestore"
import { VFLEmbedBuilder } from "../embeds/embed_builder"
import db from "../../db/firebase"

// === Helper Functions ===
function toDateString(date: any): string {
  if (date instanceof Date) return date.toLocaleDateString();
  if (date && typeof date.toDate === "function") return date.toDate().toLocaleDateString();
  return "Unknown";
}

function getTime(date: any): number {
  if (date instanceof Date) return date.getTime();
  if (date && typeof date.toDate === "function") return date.toDate().getTime();
  return 0;
}

// Define the structure of our trade data
interface TradeData {
  id?: string;
  fromTeamId: string;
  toTeamId: string;
  fromTeamName: string;
  toTeamName: string;
  players: Array<{
    name: string;
    position: string;
    fromTeam: string;
    toTeam: string;
  }>;
  draftPicks?: Array<{
    year: number;
    round: string;
    fromTeam: string;
    toTeam: string;
  }>;
  tradeDate: any; // allow both Date and Firestore Timestamp
  description?: string;
  analysis?: string;
  postedToDiscord: boolean;
  discordMessageId?: string;
}

export default {
  async handleCommand(command: Command, client: DiscordClient, firestore: Firestore, ctx: ParameterizedContext) {
    const { guild_id, token } = command;
    
    if (!command.data.options) {
      throw new Error("Trades command not configured properly");
    }
    
    const subCommand = command.data.options[0] as APIApplicationCommandInteractionDataSubcommandOption;
    const subCommandName = subCommand.name;
    
    // Defer the response since we might need to do database queries
    respond(ctx, deferMessage());
    
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
            embeds: [VFLEmbedBuilder.createErrorEmbed('Unknown Command', `Unknown subcommand: ${subCommandName}`).build()]
          });
      }
    } catch (error) {
      console.error('Error in trades command:', error);
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createErrorEmbed(
          'Command Failed',
          'An error occurred while processing your request. Please try again later.'
        ).build()]
      });
    }
  },

  commandDefinition(): RESTPostAPIApplicationCommandsJSONBody {
    return {
      name: "trades",
      description: "View and manage trade information in the VFL",
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "recent",
          description: "Show the most recent trades in the league",
          options: []
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "team",
          description: "Show all trades involving a specific team",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "team_name",
              description: "Name of the team to search for",
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "player",
          description: "Show all trades involving a specific player",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "player_name",
              description: "Name of the player to search for",
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "add",
          description: "Add a new trade to the system (Admin only)",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "from_team",
              description: "Team trading away players",
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "to_team",
              description: "Team receiving players",
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "players",
              description: "Players involved (format: 'Player Name (Position), Player Name (Position)')",
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "description",
              description: "Optional description or analysis of the trade",
              required: false
            }
          ]
        }
      ]
    };
  }
} as CommandHandler;

/**
 * Shows the most recent trades in the league
 * This gives users a quick overview of recent trading activity
 */
async function handleRecentTrades(client: DiscordClient, token: string, guildId: string) {
  try {
    const tradesSnapshot = await db.collection('vfl_trades')
      .orderBy('tradeDate', 'desc')
      .limit(5)
      .get();

    if (tradesSnapshot.empty) {
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createInfoEmbed(
          'No Recent Trades',
          'There are no recent trades to display. The trade market has been quiet!'
        ).build()]
      });
      return;
    }

    const embeds = [];
    tradesSnapshot.docs.forEach(doc => {
      const trade = doc.data() as TradeData;
      const embed = VFLEmbedBuilder.createTradeEmbed(trade);
      embed.addField('📅 Trade Date', toDateString(trade.tradeDate), true);
      embeds.push(embed.build());
    });

    await client.editOriginalInteraction(token, { embeds });
    
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Database Error',
        'Could not retrieve recent trades. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Shows all trades involving a specific team
 */
async function handleTeamTrades(client: DiscordClient, token: string, guildId: string, subCommand: any) {
  const teamName = (subCommand.options?.[0] as APIApplicationCommandInteractionDataStringOption)?.value;
  
  if (!teamName) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed('Missing Team Name', 'Please specify a team name to search for.').build()]
    });
    return;
  }

  try {
    const tradesSnapshot = await db.collection('vfl_trades')
      .where('fromTeamName', '==', teamName)
      .orderBy('tradeDate', 'desc')
      .limit(10)
      .get();

    const receivingTradesSnapshot = await db.collection('vfl_trades')
      .where('toTeamName', '==', teamName)
      .orderBy('tradeDate', 'desc')
      .limit(10)
      .get();

    // Combine and deduplicate
    const allTrades = new Map();
    [...tradesSnapshot.docs, ...receivingTradesSnapshot.docs].forEach(doc => {
      allTrades.set(doc.id, doc.data());
    });

    if (allTrades.size === 0) {
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createInfoEmbed(
          'No Trades Found',
          `${teamName} hasn't been involved in any recent trades.`
        ).build()]
      });
      return;
    }

    const embed = VFLEmbedBuilder.createInfoEmbed(
      `${teamName} Trade History`,
      `Found ${allTrades.size} recent trades involving ${teamName}`
    );

    let tradesList = '';
    Array.from(allTrades.values())
      .sort((a: any, b: any) => getTime(b.tradeDate) - getTime(a.tradeDate))
      .slice(0, 10)
      .forEach((trade: any) => {
        const date = toDateString(trade.tradeDate);
        const otherTeam = trade.fromTeamName === teamName ? trade.toTeamName : trade.fromTeamName;
        const direction = trade.fromTeamName === teamName ? 'to' : 'from';
        tradesList += `**${date}** - Trade ${direction} ${otherTeam}\n`;
      });

    embed.setDescription(tradesList);

    await client.editOriginalInteraction(token, {
      embeds: [embed.build()]
    });

  } catch (error) {
    console.error('Error fetching team trades:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Search Error',
        'Could not search for team trades. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Shows all trades involving a specific player
 */
async function handlePlayerTrades(client: DiscordClient, token: string, guildId: string, subCommand: any) {
  const playerName = (subCommand.options?.[0] as APIApplicationCommandInteractionDataStringOption)?.value;
  
  if (!playerName) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed('Missing Player Name', 'Please specify a player name to search for.').build()]
    });
    return;
  }

  try {
    const tradesSnapshot = await db.collection('vfl_trades')
      .orderBy('tradeDate', 'desc')
      .get();

    const playerTrades = [];
    tradesSnapshot.docs.forEach(doc => {
      const trade = doc.data() as TradeData;
      const hasPlayer = trade.players.some(player => 
        player.name.toLowerCase().includes(playerName.toLowerCase())
      );
      if (hasPlayer) {
        playerTrades.push(trade);
      }
    });

    if (playerTrades.length === 0) {
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createInfoEmbed(
          'No Trades Found',
          `No trades found involving a player named "${playerName}".`
        ).build()]
      });
      return;
    }

    const embed = VFLEmbedBuilder.createPlayerEmbed({
      name: playerName,
      position: 'Various',
      team: null
    });
    embed.setTitle(`👤 **${playerName} Trade History**`);

    let tradesText = '';
    playerTrades.slice(0, 10).forEach(trade => {
      const date = toDateString(trade.tradeDate);
      tradesText += `**${date}** - ${trade.fromTeamName} → ${trade.toTeamName}\n`;
    });

    embed.addField('📈 Trade History', tradesText, false);

    await client.editOriginalInteraction(token, {
      embeds: [embed.build()]
    });

  } catch (error) {
    console.error('Error fetching player trades:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Search Error',
        'Could not search for player trades. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Adds a new trade to the system (Admin only)
 */
async function handleAddTrade(client: DiscordClient, token: string, guildId: string, subCommand: any, command: Command) {
  const hasPermission = true; // TODO: Implement proper permission checking
  
  if (!hasPermission) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Permission Denied',
        'You need administrator permissions to add trades.'
      ).build()]
    });
    return;
  }

  const fromTeam = subCommand.options?.find((opt: any) => opt.name === 'from_team')?.value;
  const toTeam = subCommand.options?.find((opt: any) => opt.name === 'to_team')?.value;
  const playersString = subCommand.options?.find((opt: any) => opt.name === 'players')?.value;
  const description = subCommand.options?.find((opt: any) => opt.name === 'description')?.value || '';

  if (!fromTeam || !toTeam || !playersString) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Missing Information',
        'Please provide all required trade details: from team, to team, and players.'
      ).build()]
    });
    return;
  }

  try {
    const players = playersString.split(',').map((playerStr: string) => {
      const trimmed = playerStr.trim();
      const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
      
      if (match) {
        return {
          name: match[1].trim(),
          position: match[2].trim(),
          fromTeam: fromTeam,
          toTeam: toTeam
        };
      } else {
        return {
          name: trimmed,
          position: 'Unknown',
          fromTeam: fromTeam,
          toTeam: toTeam
        };
      }
    });

    const tradeData: TradeData = {
      fromTeamId: fromTeam.toLowerCase().replace(/\s+/g, '_'),
      toTeamId: toTeam.toLowerCase().replace(/\s+/g, '_'),
      fromTeamName: fromTeam,
      toTeamName: toTeam,
      players: players,
      tradeDate: new Date(),
      description: description,
      postedToDiscord: false
    };

    const docRef = await db.collection('vfl_trades').add(tradeData);
    await docRef.update({ id: docRef.id });

    const successEmbed = VFLEmbedBuilder.createSuccessEmbed(
      'Trade Added Successfully',
      `Trade between ${fromTeam} and ${toTeam} has been recorded and will be posted to the trades channel.`
    );

    await client.editOriginalInteraction(token, {
      embeds: [successEmbed.build()]
    });

    await postTradeToChannel(client, guildId, { ...tradeData, id: docRef.id });

  } catch (error) {
    console.error('Error adding trade:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Database Error',
        'Could not save the trade. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Posts a trade to the designated trades channel
 */
async function postTradeToChannel(client: DiscordClient, guildId: string, trade: TradeData) {
  try {
    const configDoc = await db.collection('vfl_config').doc(guildId).get();
    
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

    const embed = VFLEmbedBuilder.createTradeEmbed(trade);
    embed.addField('📅 Trade Date', toDateString(trade.tradeDate), true);
    if (trade.description) {
      embed.addField('📝 Details', trade.description, false);
    }

    const message = await client.createMessage(
      { id: tradesChannelId, id_type: 'CHANNEL' as any },
      '',
      []
    );

    if (trade.id) {
      await db.collection('vfl_trades').doc(trade.id).update({
        postedToDiscord: true,
        discordMessageId: message.id
      });
    }

    console.log(`Trade posted to channel ${tradesChannelId}:`, trade.id);

  } catch (error) {
    console.error('Error posting trade to channel:', error);
  }
}
