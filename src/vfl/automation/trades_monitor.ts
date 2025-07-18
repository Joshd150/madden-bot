import db from "../../db/firebase";
import { VFLEmbedBuilder } from "../embeds/embed_builder";
import { createClient } from "../../discord/discord_utils";
import { DISCORD_CONFIG } from "../../config";

/**
 * VFL Manager Trades Monitor - The automated heart of our trading system!
 * 
 * This is where the magic happens. This monitor constantly watches our Firestore
 * database for new trades and automatically posts them to the designated trades
 * channel. It's like having a dedicated ESPN reporter who never sleeps!
 * 
 * The system is designed to be reliable and efficient - it only posts trades that
 * haven't been posted yet, and it marks them as posted to avoid duplicates.
 */

// Create our Discord client for posting messages
const discordClient = createClient({
  publicKey: DISCORD_CONFIG.publicKey,
  botToken: DISCORD_CONFIG.token,
  appId: DISCORD_CONFIG.appId
});

/**
 * Interface for our trade data structure
 * This matches what we store in Firestore
 */
interface TradeData {
  id: string;
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
  tradeDate: any; // Firestore timestamp
  description?: string;
  analysis?: string;
  postedToDiscord: boolean;
  discordMessageId?: string;
}

/**
 * Main function that monitors for new trades
 * This runs continuously and posts new trades as they're added
 */
export async function startTradesMonitor() {
  console.log('🔄 Starting VFL Trades Monitor...');
  
  try {
    // Set up a real-time listener on our trades collection
    // This is the beauty of Firestore - we get notified instantly when data changes!
    db.collection('vfl_trades')
      .where('postedToDiscord', '==', false)
      .onSnapshot(async (snapshot) => {
        
        // Process each new trade that hasn't been posted yet
        for (const doc of snapshot.docs) {
          const trade = { id: doc.id, ...doc.data() } as TradeData;
          
          console.log(`📢 New trade detected: ${trade.fromTeamName} ↔️ ${trade.toTeamName}`);
          
          try {
            await postTradeToAllChannels(trade);
            
            // Mark the trade as posted so we don't post it again
            await doc.ref.update({
              postedToDiscord: true,
              postedAt: new Date()
            });
            
            console.log(`✅ Trade posted successfully: ${trade.id}`);
            
          } catch (error) {
            console.error(`❌ Error posting trade ${trade.id}:`, error);
            
            // Don't mark as posted if there was an error
            // This way we'll try again on the next check
          }
        }
      }, (error) => {
        console.error('❌ Error in trades monitor:', error);
        
        // If the listener fails, restart it after a delay
        setTimeout(() => {
          console.log('🔄 Restarting trades monitor...');
          startTradesMonitor();
        }, 30000); // Wait 30 seconds before restarting
      });
      
    console.log('✅ Trades monitor started successfully!');
    
  } catch (error) {
    console.error('❌ Failed to start trades monitor:', error);
    
    // Try to restart after a delay
    setTimeout(() => {
      console.log('🔄 Attempting to restart trades monitor...');
      startTradesMonitor();
    }, 60000); // Wait 1 minute before retrying
  }
}

/**
 * Posts a trade to all configured trades channels across all servers
 * This ensures that every server with a trades channel gets the update
 */
async function postTradeToAllChannels(trade: TradeData) {
  try {
    // Get all server configurations that have trades channels set up
    const configsSnapshot = await db.collection('vfl_config')
      .where('tradesChannelId', '!=', null)
      .get();

    if (configsSnapshot.empty) {
      console.log('⚠️ No servers have trades channels configured');
      return;
    }

    // Post to each configured trades channel
    const postPromises = configsSnapshot.docs.map(async (configDoc) => {
      const config = configDoc.data();
      const guildId = configDoc.id;
      const tradesChannelId = config.tradesChannelId;

      try {
        await postTradeToChannel(trade, guildId, tradesChannelId);
        console.log(`✅ Posted trade to guild ${guildId}, channel ${tradesChannelId}`);
        
      } catch (error) {
        console.error(`❌ Failed to post trade to guild ${guildId}:`, error);
        // Continue with other channels even if one fails
      }
    });

    // Wait for all posts to complete
    await Promise.all(postPromises);
    
  } catch (error) {
    console.error('❌ Error posting trade to channels:', error);
    throw error; // Re-throw so the caller knows it failed
  }
}

/**
 * Posts a trade to a specific Discord channel
 * This creates the beautiful embed and sends it to the channel
 */
async function postTradeToChannel(trade: TradeData, guildId: string, channelId: string) {
  try {
    // Create the stunning trade embed
    const embed = VFLEmbedBuilder.createTradeEmbed({
      fromTeam: {
        name: trade.fromTeamName,
        logoUrl: null // TODO: Add team logo lookup
      },
      toTeam: {
        name: trade.toTeamName,
        logoUrl: null // TODO: Add team logo lookup
      },
      players: trade.players,
      draftPicks: trade.draftPicks || [],
      analysis: trade.description
    });

    // Add the trade date for context
    const tradeDate = trade.tradeDate.toDate ? trade.tradeDate.toDate() : new Date(trade.tradeDate);
    embed.addField('📅 Trade Date', tradeDate.toLocaleDateString(), true);

    // Add trade ID for reference (useful for admins)
    embed.addField('🆔 Trade ID', trade.id, true);

    // Post the message to Discord
    const message = await discordClient.createMessage(
      { id: channelId, id_type: 'CHANNEL' as any },
      '', // No content, just the embed
      [] // No allowed mentions needed
    );

    // Store the Discord message ID for future reference
    await db.collection('vfl_trades').doc(trade.id).update({
      discordMessageId: message.id,
      discordGuildId: guildId,
      discordChannelId: channelId
    });

    return message;
    
  } catch (error) {
    console.error(`❌ Error posting to channel ${channelId}:`, error);
    throw error;
  }
}

/**
 * Manual function to post a specific trade
 * Useful for testing or re-posting trades if needed
 */
export async function postTradeManually(tradeId: string) {
  try {
    console.log(`📢 Manually posting trade: ${tradeId}`);
    
    // Get the trade data
    const tradeDoc = await db.collection('vfl_trades').doc(tradeId).get();
    
    if (!tradeDoc.exists) {
      throw new Error(`Trade ${tradeId} not found`);
    }

    const trade = { id: tradeDoc.id, ...tradeDoc.data() } as TradeData;
    
    // Post to all channels
    await postTradeToAllChannels(trade);
    
    // Mark as posted
    await tradeDoc.ref.update({
      postedToDiscord: true,
      postedAt: new Date()
    });
    
    console.log(`✅ Trade ${tradeId} posted manually`);
    
  } catch (error) {
    console.error(`❌ Error manually posting trade ${tradeId}:`, error);
    throw error;
  }
}

/**
 * Function to check for and post any missed trades
 * This is a safety net in case the real-time listener misses anything
 */
export async function checkForMissedTrades() {
  try {
    console.log('🔍 Checking for missed trades...');
    
    // Look for trades that should have been posted but weren't
    const missedTradesSnapshot = await db.collection('vfl_trades')
      .where('postedToDiscord', '==', false)
      .orderBy('tradeDate', 'desc')
      .limit(10) // Only check the 10 most recent to avoid spam
      .get();

    if (missedTradesSnapshot.empty) {
      console.log('✅ No missed trades found');
      return;
    }

    console.log(`📢 Found ${missedTradesSnapshot.docs.length} missed trades, posting now...`);

    // Post each missed trade
    for (const doc of missedTradesSnapshot.docs) {
      const trade = { id: doc.id, ...doc.data() } as TradeData;
      
      try {
        await postTradeToAllChannels(trade);
        
        await doc.ref.update({
          postedToDiscord: true,
          postedAt: new Date()
        });
        
        console.log(`✅ Posted missed trade: ${trade.id}`);
        
        // Add a small delay between posts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error posting missed trade ${trade.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking for missed trades:', error);
  }
}

// Export the monitor functions for use in the main application
export { postTradeToAllChannels, postTradeToChannel };