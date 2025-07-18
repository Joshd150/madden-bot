import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../../discord/commands_handler"
import { respond, createMessageResponse, DiscordClient, deferMessage } from "../../discord/discord_utils"
import { APIApplicationCommandInteractionDataIntegerOption, APIApplicationCommandInteractionDataStringOption, APIApplicationCommandInteractionDataSubcommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Firestore } from "firebase-admin/firestore"
import { VFLEmbedBuilder } from "../embeds/embed_builder"
import db from "../../db/firebase"

/**
 * VFL Manager Scores Command - Your one-stop shop for all game information!
 * 
 * This command is like having ESPN at your fingertips. Users can check recent scores,
 * view upcoming schedules, get detailed game breakdowns, and admins can add new
 * game results. Everything is beautifully formatted and automatically synced with
 * our web dashboard.
 * 
 * The game breakdown feature is particularly special - it provides comprehensive
 * analysis that would make any sports analyst proud!
 */

// Define our game data structure
interface GameData {
  id?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeScore: number;
  awayScore: number;
  gameDate: Date;
  week: number;
  season: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  venue?: string;
  stats?: {
    offense: {
      home: any;
      away: any;
    };
    defense: {
      home: any;
      away: any;
    };
    keyPlayers?: any[];
  };
  postedToDiscord: boolean;
  discordMessageId?: string;
}

export default {
  async handleCommand(command: Command, client: DiscordClient, firestore: Firestore, ctx: ParameterizedContext) {
    const { guild_id, token } = command;
    
    if (!command.data.options) {
      throw new Error("Scores command not configured properly");
    }
    
    const subCommand = command.data.options[0] as APIApplicationCommandInteractionDataSubcommandOption;
    const subCommandName = subCommand.name;
    
    // Always defer since we'll be doing database operations
    respond(ctx, deferMessage());
    
    try {
      switch (subCommandName) {
        case 'recent':
          await handleRecentScores(client, token, guild_id);
          break;
        case 'schedule':
          await handleSchedule(client, token, guild_id, subCommand);
          break;
        case 'team':
          await handleTeamGames(client, token, guild_id, subCommand);
          break;
        case 'breakdown':
          await handleGameBreakdown(client, token, guild_id, subCommand);
          break;
        case 'add':
          await handleAddGame(client, token, guild_id, subCommand, command);
          break;
        default:
          await client.editOriginalInteraction(token, {
            embeds: [VFLEmbedBuilder.createErrorEmbed('Unknown Command', `Unknown subcommand: ${subCommandName}`).build()]
          });
      }
    } catch (error) {
      console.error('Error in scores command:', error);
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
      name: "scores",
      description: "View game scores, schedules, and detailed breakdowns",
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "recent",
          description: "Show recent completed games with scores",
          options: []
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "schedule",
          description: "Show upcoming games and schedule",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              name: "week",
              description: "Specific week to show (optional)",
              required: false,
              min_value: 1,
              max_value: 18
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "team",
          description: "Show games for a specific team",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "team_name",
              description: "Name of the team",
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "breakdown",
          description: "Get detailed breakdown of a specific game",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "game_id",
              description: "Game ID to analyze",
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "add",
          description: "Add a game result (Admin only)",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "home_team",
              description: "Home team name",
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: "away_team",
              description: "Away team name",
              required: true
            },
            {
              type: ApplicationCommandOptionType.Integer,
              name: "home_score",
              description: "Home team score",
              required: true,
              min_value: 0
            },
            {
              type: ApplicationCommandOptionType.Integer,
              name: "away_score",
              description: "Away team score",
              required: true,
              min_value: 0
            },
            {
              type: ApplicationCommandOptionType.Integer,
              name: "week",
              description: "Week number",
              required: true,
              min_value: 1,
              max_value: 18
            }
          ]
        }
      ]
    };
  }
} as CommandHandler;

/**
 * Shows recent completed games with beautiful score displays
 * This is what users check to see "what happened last week"
 */
async function handleRecentScores(client: DiscordClient, token: string, guildId: string) {
  try {
    // Get the most recent completed games from our database
    const gamesSnapshot = await db.collection('vfl_games')
      .where('status', '==', 'completed')
      .orderBy('gameDate', 'desc')
      .limit(8)
      .get();

    if (gamesSnapshot.empty) {
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createInfoEmbed(
          'No Recent Games',
          'No completed games found. The season might not have started yet!'
        ).build()]
      });
      return;
    }

    // Create beautiful embeds for each game
    const embeds = [];
    gamesSnapshot.docs.forEach(doc => {
      const game = doc.data() as GameData;
      const embed = VFLEmbedBuilder.createGameEmbed(game);
      
      // Add some extra context for recent games
      const daysSince = Math.floor((Date.now() - game.gameDate.getTime()) / (1000 * 60 * 60 * 24));
      embed.addField('⏰ Time Ago', `${daysSince} day${daysSince !== 1 ? 's' : ''} ago`, true);
      
      embeds.push(embed.build());
    });

    await client.editOriginalInteraction(token, { embeds });

  } catch (error) {
    console.error('Error fetching recent scores:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Database Error',
        'Could not retrieve recent scores. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Shows upcoming games and schedule information
 * Perfect for planning your viewing schedule!
 */
async function handleSchedule(client: DiscordClient, token: string, guildId: string, subCommand: any) {
  const week = (subCommand.options?.find((opt: any) => opt.name === 'week') as APIApplicationCommandInteractionDataIntegerOption)?.value;
  
  try {
    let query = db.collection('vfl_games')
      .where('status', '==', 'scheduled')
      .orderBy('gameDate', 'asc');

    // Filter by specific week if requested
    if (week) {
      query = query.where('week', '==', week);
    }

    const gamesSnapshot = await query.limit(15).get();

    if (gamesSnapshot.empty) {
      const message = week 
        ? `No games scheduled for week ${week}.`
        : 'No upcoming games scheduled.';
        
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createInfoEmbed('No Scheduled Games', message).build()]
      });
      return;
    }

    // Group games by week for better organization
    const gamesByWeek = new Map();
    gamesSnapshot.docs.forEach(doc => {
      const game = doc.data() as GameData;
      if (!gamesByWeek.has(game.week)) {
        gamesByWeek.set(game.week, []);
      }
      gamesByWeek.get(game.week).push(game);
    });

    const embeds = [];
    
    // Create an embed for each week
    for (const [weekNum, weekGames] of gamesByWeek) {
      const embed = VFLEmbedBuilder.createInfoEmbed(
        `📅 Week ${weekNum} Schedule`,
        `${weekGames.length} games scheduled`
      );

      let scheduleText = '';
      weekGames.forEach((game: GameData) => {
        const gameDate = new Date(game.gameDate);
        const dateStr = gameDate.toLocaleDateString();
        const timeStr = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        scheduleText += `**${game.awayTeamAbbr}** @ **${game.homeTeamAbbr}**\n`;
        scheduleText += `${dateStr} at ${timeStr}\n`;
        if (game.venue) scheduleText += `📍 ${game.venue}\n`;
        scheduleText += '\n';
      });

      embed.setDescription(scheduleText);
      embeds.push(embed.build());
    }

    await client.editOriginalInteraction(token, { embeds });

  } catch (error) {
    console.error('Error fetching schedule:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Database Error',
        'Could not retrieve schedule information. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Shows games for a specific team
 * Great for team-focused fans who want to track their favorite squad
 */
async function handleTeamGames(client: DiscordClient, token: string, guildId: string, subCommand: any) {
  const teamName = (subCommand.options?.find((opt: any) => opt.name === 'team_name') as APIApplicationCommandInteractionDataStringOption)?.value;
  
  if (!teamName) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed('Missing Team Name', 'Please specify a team name.').build()]
    });
    return;
  }

  try {
    // Search for games where this team is either home or away
    const homeGamesSnapshot = await db.collection('vfl_games')
      .where('homeTeamName', '==', teamName)
      .orderBy('gameDate', 'desc')
      .limit(10)
      .get();

    const awayGamesSnapshot = await db.collection('vfl_games')
      .where('awayTeamName', '==', teamName)
      .orderBy('gameDate', 'desc')
      .limit(10)
      .get();

    // Combine and sort all games
    const allGames = [];
    [...homeGamesSnapshot.docs, ...awayGamesSnapshot.docs].forEach(doc => {
      allGames.push({ id: doc.id, ...doc.data() });
    });

    // Sort by date and remove duplicates
    const uniqueGames = Array.from(
      new Map(allGames.map(game => [game.id, game])).values()
    ).sort((a: any, b: any) => b.gameDate.toDate().getTime() - a.gameDate.toDate().getTime());

    if (uniqueGames.length === 0) {
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createInfoEmbed(
          'No Games Found',
          `No games found for ${teamName}. Check the team name spelling.`
        ).build()]
      });
      return;
    }

    // Create a team schedule overview
    const embed = VFLEmbedBuilder.createTeamEmbed({
      name: teamName,
      city: '', // We don't have this info from the search
      logoUrl: null
    });

    embed.setTitle(`🏈 **${teamName} Games**`);

    // Separate completed and upcoming games
    const completedGames = uniqueGames.filter((game: any) => game.status === 'completed');
    const upcomingGames = uniqueGames.filter((game: any) => game.status === 'scheduled');

    // Show recent completed games
    if (completedGames.length > 0) {
      let recentText = '';
      completedGames.slice(0, 5).forEach((game: any) => {
        const isHome = game.homeTeamName === teamName;
        const opponent = isHome ? game.awayTeamName : game.homeTeamName;
        const teamScore = isHome ? game.homeScore : game.awayScore;
        const oppScore = isHome ? game.awayScore : game.homeScore;
        const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'T';
        const resultEmoji = result === 'W' ? '✅' : result === 'L' ? '❌' : '🟡';
        
        recentText += `${resultEmoji} Week ${game.week}: ${result} vs ${opponent} (${teamScore}-${oppScore})\n`;
      });
      
      embed.addField('🎯 Recent Games', recentText, false);
    }

    // Show upcoming games
    if (upcomingGames.length > 0) {
      let upcomingText = '';
      upcomingGames.slice(0, 5).forEach((game: any) => {
        const isHome = game.homeTeamName === teamName;
        const opponent = isHome ? game.awayTeamName : game.homeTeamName;
        const location = isHome ? 'vs' : '@';
        const date = game.gameDate.toDate().toLocaleDateString();
        
        upcomingText += `📅 Week ${game.week}: ${location} ${opponent} (${date})\n`;
      });
      
      embed.addField('📅 Upcoming Games', upcomingText, false);
    }

    await client.editOriginalInteraction(token, {
      embeds: [embed.build()]
    });

  } catch (error) {
    console.error('Error fetching team games:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Search Error',
        'Could not search for team games. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Creates a detailed game breakdown - this is our premium feature!
 * Provides comprehensive analysis that would make ESPN jealous
 */
async function handleGameBreakdown(client: DiscordClient, token: string, guildId: string, subCommand: any) {
  const gameId = (subCommand.options?.find((opt: any) => opt.name === 'game_id') as APIApplicationCommandInteractionDataStringOption)?.value;
  
  if (!gameId) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed('Missing Game ID', 'Please specify a game ID to analyze.').build()]
    });
    return;
  }

  try {
    // Get the specific game from our database
    const gameDoc = await db.collection('vfl_games').doc(gameId).get();

    if (!gameDoc.exists) {
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createErrorEmbed(
          'Game Not Found',
          `Could not find a game with ID: ${gameId}`
        ).build()]
      });
      return;
    }

    const game = gameDoc.data() as GameData;

    if (game.status !== 'completed') {
      await client.editOriginalInteraction(token, {
        embeds: [VFLEmbedBuilder.createWarningEmbed(
          'Game Not Completed',
          'Detailed breakdowns are only available for completed games.'
        ).build()]
      });
      return;
    }

    // Create the comprehensive breakdown embed
    const stats = game.stats || {
      offense: {
        home: { totalYards: 0, passingYards: 0, rushingYards: 0, firstDowns: 0 },
        away: { totalYards: 0, passingYards: 0, rushingYards: 0, firstDowns: 0 }
      },
      defense: {
        home: { sacks: 0, interceptions: 0, fumbles: 0, tacklesForLoss: 0 },
        away: { sacks: 0, interceptions: 0, fumbles: 0, tacklesForLoss: 0 }
      },
      keyPlayers: []
    };

    const embed = VFLEmbedBuilder.createGameBreakdownEmbed(game, stats);
    
    // Add game ID for reference
    embed.addField('🆔 Game Reference', `Game ID: ${gameId}`, true);
    
    // Add attendance if we have it
    if (game.venue) {
      embed.addField('🏟️ Venue', game.venue, true);
    }

    await client.editOriginalInteraction(token, {
      embeds: [embed.build()]
    });

  } catch (error) {
    console.error('Error fetching game breakdown:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Analysis Error',
        'Could not generate game breakdown. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Adds a new game result to the system (Admin only)
 * This triggers the automated score posting system
 */
async function handleAddGame(client: DiscordClient, token: string, guildId: string, subCommand: any, command: Command) {
  // Check admin permissions (simplified for this example)
  const hasPermission = true; // TODO: Implement proper permission checking
  
  if (!hasPermission) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Permission Denied',
        'You need administrator permissions to add game results.'
      ).build()]
    });
    return;
  }

  // Extract game information from the command
  const homeTeam = subCommand.options?.find((opt: any) => opt.name === 'home_team')?.value;
  const awayTeam = subCommand.options?.find((opt: any) => opt.name === 'away_team')?.value;
  const homeScore = subCommand.options?.find((opt: any) => opt.name === 'home_score')?.value;
  const awayScore = subCommand.options?.find((opt: any) => opt.name === 'away_score')?.value;
  const week = subCommand.options?.find((opt: any) => opt.name === 'week')?.value;

  if (!homeTeam || !awayTeam || homeScore === undefined || awayScore === undefined || !week) {
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Missing Information',
        'Please provide all required game details.'
      ).build()]
    });
    return;
  }

  try {
    // Create the game object
    const gameData: GameData = {
      homeTeamId: homeTeam.toLowerCase().replace(/\s+/g, '_'),
      awayTeamId: awayTeam.toLowerCase().replace(/\s+/g, '_'),
      homeTeamName: homeTeam,
      awayTeamName: awayTeam,
      homeTeamAbbr: homeTeam.substring(0, 3).toUpperCase(),
      awayTeamAbbr: awayTeam.substring(0, 3).toUpperCase(),
      homeScore: homeScore,
      awayScore: awayScore,
      gameDate: new Date(),
      week: week,
      season: new Date().getFullYear(),
      status: 'completed',
      postedToDiscord: false
    };

    // Save to Firestore
    const docRef = await db.collection('vfl_games').add(gameData);
    
    // Update with the document ID
    await docRef.update({ id: docRef.id });

    // Create success message
    const winner = homeScore > awayScore ? homeTeam : awayScore > homeScore ? awayTeam : 'Tie';
    const resultText = homeScore === awayScore 
      ? `${awayTeam} ${awayScore} - ${homeScore} ${homeTeam} (Tie)`
      : `${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`;

    const successEmbed = VFLEmbedBuilder.createSuccessEmbed(
      'Game Result Added',
      `**Week ${week}:** ${resultText}\n\nThis result will be posted to the scores channel automatically.`
    );

    await client.editOriginalInteraction(token, {
      embeds: [successEmbed.build()]
    });

    // Trigger automated score posting
    await postGameToChannel(client, guildId, { ...gameData, id: docRef.id });

  } catch (error) {
    console.error('Error adding game:', error);
    await client.editOriginalInteraction(token, {
      embeds: [VFLEmbedBuilder.createErrorEmbed(
        'Database Error',
        'Could not save the game result. Please try again later.'
      ).build()]
    });
  }
}

/**
 * Posts a game result to the designated scores channel
 * This is our automated posting system in action!
 */
async function postGameToChannel(client: DiscordClient, guildId: string, game: GameData) {
  try {
    // Get the server configuration
    const configDoc = await db.collection('vfl_config').doc(guildId).get();
    
    if (!configDoc.exists) {
      console.log('No VFL configuration found for guild:', guildId);
      return;
    }

    const config = configDoc.data();
    const scoresChannelId = config?.scoresChannelId;

    if (!scoresChannelId) {
      console.log('No scores channel configured for guild:', guildId);
      return;
    }

    // Create the game embed for posting
    const embed = VFLEmbedBuilder.createGameEmbed(game);
    
    // Add some extra flair for the channel post
    const winner = game.homeScore > game.awayScore ? game.homeTeamName : 
                   game.awayScore > game.homeScore ? game.awayTeamName : null;
    
    if (winner) {
      embed.addField('🏆 Winner', winner, true);
    }

    // Post to the scores channel
    const message = await client.createMessage(
      { id: scoresChannelId, id_type: 'CHANNEL' as any },
      '',
      []
    );

    // Update the game record
    if (game.id) {
      await db.collection('vfl_games').doc(game.id).update({
        postedToDiscord: true,
        discordMessageId: message.id
      });
    }

    console.log(`Game result posted to channel ${scoresChannelId}:`, game.id);

  } catch (error) {
    console.error('Error posting game to channel:', error);
  }
}