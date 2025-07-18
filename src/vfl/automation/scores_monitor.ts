import db from "../../db/firebase";
import { VFLEmbedBuilder } from "../embeds/embed_builder";
import { createClient } from "../../discord/discord_utils";
import { DISCORD_CONFIG } from "../../config";

/**
 * VFL Manager Scores Monitor - Your automated sports center!
 * 
 * This monitor is like having SportsCenter running 24/7 for your league. It watches
 * for new game results and automatically posts them to the scores channel with
 * beautiful formatting. No more manually posting scores - this handles everything!
 * 
 * The system is smart enough to only post new scores and can handle both completed
 * games and live score updates during games.
 */

// Create our Discord client for posting messages
const discordClient = createClient({
  publicKey: DISCORD_CONFIG.publicKey,
  botToken: DISCORD_CONFIG.token,
  appId: DISCORD_CONFIG.appId
});

/**
 * Interface for our game data structure
 */
interface GameData {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeScore: number;
  awayScore: number;
  gameDate: any; // Firestore timestamp
  week: number;
  season: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  venue?: string;
  stats?: any;
  postedToDiscord: boolean;
  discordMessageId?: string;
}

/**
 * Starts the scores monitoring system
 * This sets up real-time listeners for game updates
 */
export async function startScoresMonitor() {
  console.log('🏈 Starting VFL Scores Monitor...');
  
  try {
    // Listen for completed games that haven't been posted yet
    db.collection('vfl_games')
      .where('status', '==', 'completed')
      .where('postedToDiscord', '==', false)
      .onSnapshot(async (snapshot) => {
        
        for (const doc of snapshot.docs) {
          const game = { id: doc.id, ...doc.data() } as GameData;
          
          console.log(`🏆 New completed game: ${game.awayTeamName} vs ${game.homeTeamName}`);
          
          try {
            await postGameToAllChannels(game);
            
            // Mark as posted
            await doc.ref.update({
              postedToDiscord: true,
              postedAt: new Date()
            });
            
            console.log(`✅ Game result posted: ${game.id}`);
            
          } catch (error) {
            console.error(`❌ Error posting game ${game.id}:`, error);
          }
        }
      }, (error) => {
        console.error('❌ Error in scores monitor:', error);
        
        // Restart the monitor after a delay
        setTimeout(() => {
          console.log('🔄 Restarting scores monitor...');
          startScoresMonitor();
        }, 30000);
      });

    // Also listen for live game updates (optional feature)
    db.collection('vfl_games')
      .where('status', '==', 'in_progress')
      .onSnapshot(async (snapshot) => {
        
        for (const doc of snapshot.docs) {
          const game = { id: doc.id, ...doc.data() } as GameData;
          
          // Only post live updates if the score has changed significantly
          // This prevents spam from minor updates
          if (shouldPostLiveUpdate(game)) {
            console.log(`🔴 Live game update: ${game.awayTeamName} vs ${game.homeTeamName}`);
            
            try {
              await postLiveGameUpdate(game);
              
            } catch (error) {
              console.error(`❌ Error posting live update for game ${game.id}:`, error);
            }
          }
        }
      });
      
    console.log('✅ Scores monitor started successfully!');
    
  } catch (error) {
    console.error('❌ Failed to start scores monitor:', error);
    
    setTimeout(() => {
      console.log('🔄 Attempting to restart scores monitor...');
      startScoresMonitor();
    }, 60000);
  }
}

/**
 * Posts a completed game to all configured scores channels
 */
async function postGameToAllChannels(game: GameData) {
  try {
    // Get all server configurations with scores channels
    const configsSnapshot = await db.collection('vfl_config')
      .where('scoresChannelId', '!=', null)
      .get();

    if (configsSnapshot.empty) {
      console.log('⚠️ No servers have scores channels configured');
      return;
    }

    // Post to each configured channel
    const postPromises = configsSnapshot.docs.map(async (configDoc) => {
      const config = configDoc.data();
      const guildId = configDoc.id;
      const scoresChannelId = config.scoresChannelId;

      try {
        await postGameToChannel(game, guildId, scoresChannelId);
        console.log(`✅ Posted game to guild ${guildId}, channel ${scoresChannelId}`);
        
      } catch (error) {
        console.error(`❌ Failed to post game to guild ${guildId}:`, error);
      }
    });

    await Promise.all(postPromises);
    
  } catch (error) {
    console.error('❌ Error posting game to channels:', error);
    throw error;
  }
}

/**
 * Posts a game result to a specific Discord channel
 */
async function postGameToChannel(game: GameData, guildId: string, channelId: string) {
  try {
    // Create the game embed with all the details
    const embed = VFLEmbedBuilder.createGameEmbed({
      homeTeam: {
        name: game.homeTeamName,
        abbreviation: game.homeTeamAbbr,
        logoUrl: null // TODO: Add team logo lookup
      },
      awayTeam: {
        name: game.awayTeamName,
        abbreviation: game.awayTeamAbbr,
        logoUrl: null // TODO: Add team logo lookup
      },
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      gameDate: game.gameDate.toDate ? game.gameDate.toDate() : new Date(game.gameDate),
      week: game.week,
      status: game.status
    });

    // Add winner information
    const winner = game.homeScore > game.awayScore ? game.homeTeamName :
                   game.awayScore > game.homeScore ? game.awayTeamName : null;
    
    if (winner) {
      embed.addField('🏆 Winner', winner, true);
    } else {
      embed.addField('🤝 Result', 'Tie Game', true);
    }

    // Add point differential
    const differential = Math.abs(game.homeScore - game.awayScore);
    if (differential > 0) {
      embed.addField('📊 Margin', `${differential} points`, true);
    }

    // Add game ID for reference
    embed.addField('🆔 Game ID', game.id, true);

    // Post to Discord
    const message = await discordClient.createMessage(
      { id: channelId, id_type: 'CHANNEL' as any },
      '',
      []
    );

    // Store the message ID
    await db.collection('vfl_games').doc(game.id).update({
      discordMessageId: message.id,
      discordGuildId: guildId,
      discordChannelId: channelId
    });

    return message;
    
  } catch (error) {
    console.error(`❌ Error posting game to channel ${channelId}:`, error);
    throw error;
  }
}

/**
 * Posts live game updates (optional feature)
 * This can post score updates during games for real-time excitement
 */
async function postLiveGameUpdate(game: GameData) {
  try {
    // Get configurations that have live updates enabled
    const configsSnapshot = await db.collection('vfl_config')
      .where('scoresChannelId', '!=', null)
      .where('liveUpdatesEnabled', '==', true)
      .get();

    for (const configDoc of configsSnapshot.docs) {
      const config = configDoc.data();
      const channelId = config.scoresChannelId;

      try {
        // Create a live update embed
        const embed = VFLEmbedBuilder.createGameEmbed({
          ...game,
          gameDate: game.gameDate.toDate ? game.gameDate.toDate() : new Date(game.gameDate)
        });

        // Add live indicator
        embed.addField('🔴 Status', 'LIVE GAME', true);

        await discordClient.createMessage(
          { id: channelId, id_type: 'CHANNEL' as any },
          '',
          []
        );

      } catch (error) {
        console.error(`❌ Error posting live update to channel ${channelId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error posting live game updates:', error);
  }
}

/**
 * Determines if a live game update should be posted
 * This prevents spam by only posting significant updates
 */
function shouldPostLiveUpdate(game: GameData): boolean {
  // Only post live updates for certain conditions:
  // - Score changes by 7+ points
  // - Game just started
  // - Game entering final quarter
  // This is a simplified version - you can make it more sophisticated
  
  const totalScore = game.homeScore + game.awayScore;
  const scoreDifference = Math.abs(game.homeScore - game.awayScore);
  
  // Post if it's a high-scoring game or close game
  return totalScore > 21 || scoreDifference <= 3;
}

/**
 * Manual function to post a specific game
 */
export async function postGameManually(gameId: string) {
  try {
    console.log(`🏈 Manually posting game: ${gameId}`);
    
    const gameDoc = await db.collection('vfl_games').doc(gameId).get();
    
    if (!gameDoc.exists) {
      throw new Error(`Game ${gameId} not found`);
    }

    const game = { id: gameDoc.id, ...gameDoc.data() } as GameData;
    
    await postGameToAllChannels(game);
    
    await gameDoc.ref.update({
      postedToDiscord: true,
      postedAt: new Date()
    });
    
    console.log(`✅ Game ${gameId} posted manually`);
    
  } catch (error) {
    console.error(`❌ Error manually posting game ${gameId}:`, error);
    throw error;
  }
}

/**
 * Check for missed game results and post them
 */
export async function checkForMissedGames() {
  try {
    console.log('🔍 Checking for missed game results...');
    
    const missedGamesSnapshot = await db.collection('vfl_games')
      .where('status', '==', 'completed')
      .where('postedToDiscord', '==', false)
      .orderBy('gameDate', 'desc')
      .limit(10)
      .get();

    if (missedGamesSnapshot.empty) {
      console.log('✅ No missed games found');
      return;
    }

    console.log(`🏈 Found ${missedGamesSnapshot.docs.length} missed games, posting now...`);

    for (const doc of missedGamesSnapshot.docs) {
      const game = { id: doc.id, ...doc.data() } as GameData;
      
      try {
        await postGameToAllChannels(game);
        
        await doc.ref.update({
          postedToDiscord: true,
          postedAt: new Date()
        });
        
        console.log(`✅ Posted missed game: ${game.id}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error posting missed game ${game.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking for missed games:', error);
  }
}

export { postGameToAllChannels, postGameToChannel };