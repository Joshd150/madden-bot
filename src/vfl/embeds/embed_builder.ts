import { APIEmbed, APIEmbedField } from "discord-api-types/v10";

/**
 * VFL Manager Embed Builder - Creates beautiful, consistent embeds for all bot responses
 * 
 * This class is the heart of our visual design system. Every message the bot sends
 * uses these embeds to ensure a professional, polished appearance that users love.
 * Think of this as our "brand guidelines" in code form!
 */

export enum VFLColor {
  PRIMARY = 0x1f8b4c,      // Our signature green - used for general info
  SUCCESS = 0x57f287,      // Bright green for successful operations
  WARNING = 0xfee75c,      // Yellow for warnings and cautions
  ERROR = 0xed4245,        // Red for errors and problems
  INFO = 0x5865f2,         // Discord's blurple for informational content
  SECONDARY = 0x99aab5,    // Gray for secondary information
  TRADE = 0xff6b35,        // Orange for trade announcements - makes them pop!
  GAME = 0x4169e1,         // Royal blue for game-related content
  PLAYER = 0x9932cc,       // Purple for player profiles and stats
  TEAM = 0xffd700,         // Gold for team information and standings
}

export class VFLEmbedBuilder {
  private embed: APIEmbed = {};

  constructor() {
    // Every embed gets our signature color and timestamp by default
    // This creates consistency across all bot messages
    this.embed.color = VFLColor.PRIMARY;
    this.embed.timestamp = new Date().toISOString();
  }

  /**
   * Creates a stunning trade announcement embed
   * This is what users see when trades happen - we want it to look amazing!
   */
  static createTradeEmbed(trade: any): VFLEmbedBuilder {
    const embed = new VFLEmbedBuilder()
      .setColor(VFLColor.TRADE)
      .setTitle('🔄 **TRADE ALERT**')
      .setFooter('VFL Manager • Trade Central', 'https://example.com/vfl-logo.png');

    // Build the trade description with all the juicy details
    let description = `**${trade.fromTeam?.name}** ↔️ **${trade.toTeam?.name}**\n\n`;
    
    // Show all players involved - this is what people really want to see!
    if (trade.players && trade.players.length > 0) {
      description += '**Players Involved:**\n';
      trade.players.forEach((player: any) => {
        description += `• **${player.name}** (${player.position}) - ${player.fromTeam} → ${player.toTeam}\n`;
      });
    }

    // Don't forget about draft picks - they're valuable too!
    if (trade.draftPicks && trade.draftPicks.length > 0) {
      description += '\n**Draft Picks:**\n';
      trade.draftPicks.forEach((pick: any) => {
        description += `• ${pick.year} ${pick.round} Round Pick\n`;
      });
    }

    // Add some analysis or commentary if we have it
    if (trade.analysis) {
      description += `\n**Trade Analysis:** ${trade.analysis}`;
    }

    embed.setDescription(description);

    // Add the team logo as a thumbnail for visual appeal
    if (trade.fromTeam?.logoUrl) {
      embed.setThumbnail(trade.fromTeam.logoUrl);
    }

    return embed;
  }

  /**
   * Creates a comprehensive game result embed
   * Perfect for showing final scores, live updates, or upcoming games
   */
  static createGameEmbed(game: any): VFLEmbedBuilder {
    const embed = new VFLEmbedBuilder()
      .setFooter('VFL Manager • Game Center', 'https://example.com/vfl-logo.png');

    // Different colors and titles based on game status
    if (game.status === 'completed') {
      embed.setTitle('🏆 **FINAL SCORE**').setColor(VFLColor.SUCCESS);
    } else if (game.status === 'in_progress') {
      embed.setTitle('🔴 **LIVE GAME**').setColor(VFLColor.ERROR);
    } else {
      embed.setTitle('📅 **UPCOMING GAME**').setColor(VFLColor.WARNING);
    }

    // Create the main score display - this is the money shot!
    let scoreDisplay = '';
    if (game.status === 'completed' || game.status === 'in_progress') {
      // Show the actual scores with emphasis on the winner
      const awayWin = game.awayScore > game.homeScore;
      const homeWin = game.homeScore > game.awayScore;
      
      scoreDisplay = awayWin 
        ? `**${game.awayTeam.name} ${game.awayScore}** - ${game.homeScore} ${game.homeTeam.name}`
        : homeWin
        ? `${game.awayTeam.name} ${game.awayScore} - **${game.homeScore} ${game.homeTeam.name}**`
        : `${game.awayTeam.name} ${game.awayScore} - ${game.homeScore} ${game.homeTeam.name}`;
    } else {
      scoreDisplay = `**${game.awayTeam.name}** @ **${game.homeTeam.name}**`;
    }

    embed.setDescription(scoreDisplay);

    // Add useful game information in a clean format
    embed.addField('📅 Date & Time', new Date(game.gameDate).toLocaleString(), true);
    embed.addField('🏟️ Week', `Week ${game.week}`, true);
    
    // Add venue information if we have it
    if (game.venue) {
      embed.addField('🏟️ Venue', game.venue, true);
    }

    // Use the home team's logo as the thumbnail
    if (game.homeTeam?.logoUrl) {
      embed.setThumbnail(game.homeTeam.logoUrl);
    }

    return embed;
  }

  /**
   * Creates an incredibly detailed game breakdown embed
   * This is our premium feature - comprehensive game analysis that looks professional
   */
  static createGameBreakdownEmbed(game: any, stats: any): VFLEmbedBuilder {
    const embed = new VFLEmbedBuilder()
      .setColor(VFLColor.GAME)
      .setTitle('📊 **COMPREHENSIVE GAME BREAKDOWN**')
      .setFooter('VFL Manager • Advanced Analytics', 'https://example.com/vfl-logo.png');

    // Start with the game header - who played, when, and what happened
    const gameHeader = `**${game.awayTeam.name}** ${game.awayScore} - ${game.homeScore} **${game.homeTeam.name}**\n` +
                      `Week ${game.week} • ${new Date(game.gameDate).toLocaleDateString()}\n` +
                      `${game.venue || 'Stadium TBD'}`;
    
    embed.setDescription(gameHeader);

    // Offensive statistics comparison - side by side for easy reading
    if (stats.offense) {
      let offenseStats = '';
      offenseStats += `**Total Yards:**\n`;
      offenseStats += `${game.awayTeam.abbreviation}: ${stats.offense.away.totalYards} | ${game.homeTeam.abbreviation}: ${stats.offense.home.totalYards}\n\n`;
      
      offenseStats += `**Passing Yards:**\n`;
      offenseStats += `${game.awayTeam.abbreviation}: ${stats.offense.away.passingYards} | ${game.homeTeam.abbreviation}: ${stats.offense.home.passingYards}\n\n`;
      
      offenseStats += `**Rushing Yards:**\n`;
      offenseStats += `${game.awayTeam.abbreviation}: ${stats.offense.away.rushingYards} | ${game.homeTeam.abbreviation}: ${stats.offense.home.rushingYards}\n\n`;
      
      offenseStats += `**First Downs:**\n`;
      offenseStats += `${game.awayTeam.abbreviation}: ${stats.offense.away.firstDowns} | ${game.homeTeam.abbreviation}: ${stats.offense.home.firstDowns}`;
      
      embed.addField('⚡ Offensive Statistics', offenseStats, false);
    }

    // Defensive statistics - turnovers, sacks, all the good stuff
    if (stats.defense) {
      let defenseStats = '';
      defenseStats += `**Sacks:**\n`;
      defenseStats += `${game.awayTeam.abbreviation}: ${stats.defense.away.sacks} | ${game.homeTeam.abbreviation}: ${stats.defense.home.sacks}\n\n`;
      
      defenseStats += `**Interceptions:**\n`;
      defenseStats += `${game.awayTeam.abbreviation}: ${stats.defense.away.interceptions} | ${game.homeTeam.abbreviation}: ${stats.defense.home.interceptions}\n\n`;
      
      defenseStats += `**Fumbles Recovered:**\n`;
      defenseStats += `${game.awayTeam.abbreviation}: ${stats.defense.away.fumbles} | ${game.homeTeam.abbreviation}: ${stats.defense.home.fumbles}\n\n`;
      
      defenseStats += `**Tackles for Loss:**\n`;
      defenseStats += `${game.awayTeam.abbreviation}: ${stats.defense.away.tacklesForLoss} | ${game.homeTeam.abbreviation}: ${stats.defense.home.tacklesForLoss}`;
      
      embed.addField('🛡️ Defensive Statistics', defenseStats, false);
    }

    // Highlight the star players from this game
    if (stats.keyPlayers && stats.keyPlayers.length > 0) {
      let keyPlayersText = '';
      stats.keyPlayers.forEach((player: any) => {
        keyPlayersText += `**${player.name}** (${player.team})\n`;
        keyPlayersText += `${player.stats}\n\n`;
      });
      
      embed.addField('⭐ Star Performances', keyPlayersText, false);
    }

    // Add team logos for visual appeal
    if (game.homeTeam?.logoUrl) {
      embed.setThumbnail(game.homeTeam.logoUrl);
    }

    return embed;
  }

  /**
   * Creates a detailed player profile embed
   * Shows everything you'd want to know about a player
   */
  static createPlayerEmbed(player: any): VFLEmbedBuilder {
    const embed = new VFLEmbedBuilder()
      .setColor(VFLColor.PLAYER)
      .setTitle(`👤 **${player.name}**`)
      .setFooter('VFL Manager • Player Database', 'https://example.com/vfl-logo.png');

    // Basic player information in a clean, readable format
    let playerInfo = `**Position:** ${player.position}\n`;
    playerInfo += `**Team:** ${player.team?.name || 'Free Agent'}\n`;
    playerInfo += `**Jersey #:** ${player.jerseyNumber || 'N/A'}\n`;
    playerInfo += `**Age:** ${player.age || 'N/A'}\n`;
    
    // Add physical stats if we have them
    if (player.height) playerInfo += `**Height:** ${player.height}\n`;
    if (player.weight) playerInfo += `**Weight:** ${player.weight} lbs\n`;
    if (player.college) playerInfo += `**College:** ${player.college}\n`;
    if (player.yearsPro !== undefined) playerInfo += `**Years Pro:** ${player.yearsPro}\n`;

    embed.setDescription(playerInfo);

    // Contract details - always interesting for fantasy purposes
    if (player.salary || player.contractYears) {
      let contractInfo = '';
      if (player.salary) contractInfo += `**Salary:** $${player.salary.toLocaleString()}\n`;
      if (player.contractYears) contractInfo += `**Contract Length:** ${player.contractYears} years\n`;
      if (player.contractStatus) contractInfo += `**Status:** ${player.contractStatus}\n`;
      
      embed.addField('💰 Contract Details', contractInfo, true);
    }

    // Season statistics - the meat and potatoes
    if (player.stats) {
      let statsText = '';
      Object.entries(player.stats).forEach(([key, value]) => {
        // Format the stat names to be more readable
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        statsText += `**${formattedKey}:** ${value}\n`;
      });
      
      embed.addField('📈 Season Statistics', statsText, true);
    }

    // Add the team logo as thumbnail for context
    if (player.team?.logoUrl) {
      embed.setThumbnail(player.team.logoUrl);
    }

    return embed;
  }

  /**
   * Creates a comprehensive team overview embed
   * Perfect for showing team stats, roster info, and recent performance
   */
  static createTeamEmbed(team: any): VFLEmbedBuilder {
    const embed = new VFLEmbedBuilder()
      .setColor(team.primaryColor ? parseInt(team.primaryColor.replace('#', ''), 16) : VFLColor.TEAM)
      .setTitle(`🏈 **${team.city} ${team.name}**`)
      .setFooter('VFL Manager • Team Central', 'https://example.com/vfl-logo.png');

    // Team basic information and current standing
    let teamInfo = `**Conference:** ${team.conference || 'N/A'}\n`;
    teamInfo += `**Division:** ${team.division || 'N/A'}\n`;
    
    if (team.record) {
      teamInfo += `**Record:** ${team.record.wins}-${team.record.losses}`;
      if (team.record.ties > 0) teamInfo += `-${team.record.ties}`;
      teamInfo += '\n';
    }

    if (team.playoffStatus) {
      teamInfo += `**Playoff Status:** ${team.playoffStatus}\n`;
    }

    embed.setDescription(teamInfo);

    // Team statistics - offense and defense side by side
    if (team.stats) {
      let offenseStats = '';
      if (team.stats.pointsFor) offenseStats += `**Points For:** ${team.stats.pointsFor}\n`;
      if (team.stats.totalYards) offenseStats += `**Total Yards:** ${team.stats.totalYards}\n`;
      if (team.stats.passingYards) offenseStats += `**Passing:** ${team.stats.passingYards}\n`;
      if (team.stats.rushingYards) offenseStats += `**Rushing:** ${team.stats.rushingYards}\n`;
      
      let defenseStats = '';
      if (team.stats.pointsAgainst) defenseStats += `**Points Against:** ${team.stats.pointsAgainst}\n`;
      if (team.stats.yardsAllowed) defenseStats += `**Yards Allowed:** ${team.stats.yardsAllowed}\n`;
      if (team.stats.sacks) defenseStats += `**Sacks:** ${team.stats.sacks}\n`;
      if (team.stats.interceptions) defenseStats += `**Interceptions:** ${team.stats.interceptions}\n`;
      
      if (offenseStats) embed.addField('⚡ Offense', offenseStats, true);
      if (defenseStats) embed.addField('🛡️ Defense', defenseStats, true);
    }

    // Recent games performance
    if (team.recentGames && team.recentGames.length > 0) {
      let recentGamesText = '';
      team.recentGames.slice(0, 5).forEach((game: any) => {
        const result = game.homeTeamId === team.id 
          ? (game.homeScore > game.awayScore ? 'W' : game.homeScore < game.awayScore ? 'L' : 'T')
          : (game.awayScore > game.homeScore ? 'W' : game.awayScore < game.homeScore ? 'L' : 'T');
        
        const resultEmoji = result === 'W' ? '✅' : result === 'L' ? '❌' : '🟡';
        recentGamesText += `${resultEmoji} ${result} vs ${game.opponent} (${game.score})\n`;
      });
      
      embed.addField('🎯 Recent Games', recentGamesText, false);
    }

    // Always add the team logo - visual branding is important!
    if (team.logoUrl) {
      embed.setThumbnail(team.logoUrl);
    }

    return embed;
  }

  /**
   * Creates beautiful league standings embeds
   * Can show full league or filter by conference/division
   */
  static createStandingsEmbed(standings: any[], conference?: string): VFLEmbedBuilder {
    const embed = new VFLEmbedBuilder()
      .setColor(VFLColor.TEAM)
      .setTitle(`🏆 **${conference ? conference.toUpperCase() + ' ' : ''}STANDINGS**`)
      .setFooter('VFL Manager • League Office', 'https://example.com/vfl-logo.png');

    if (conference) {
      // Group by divisions for conference view
      const divisions = [...new Set(standings.map(team => team.division))];
      
      divisions.forEach(division => {
        const divisionTeams = standings
          .filter(team => team.division === division)
          .sort((a, b) => {
            // Proper standings sort: wins, then win percentage, then points for
            if (a.wins !== b.wins) return b.wins - a.wins;
            const aWinPct = a.wins / (a.wins + a.losses + (a.ties || 0));
            const bWinPct = b.wins / (b.wins + b.losses + (b.ties || 0));
            if (aWinPct !== bWinPct) return bWinPct - aWinPct;
            return (b.pointsFor || 0) - (a.pointsFor || 0);
          });

        let divisionText = '';
        divisionTeams.forEach((team, index) => {
          const record = `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`;
          const rank = index + 1;
          const rankEmoji = rank === 1 ? '👑' : rank <= 3 ? '🔥' : '📍';
          divisionText += `${rankEmoji} ${rank}. **${team.name}** (${record})\n`;
        });

        embed.addField(`${division} Division`, divisionText, true);
      });
    } else {
      // Show overall league standings
      let standingsText = '';
      standings.slice(0, 16).forEach((team, index) => {
        const record = `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`;
        const rank = index + 1;
        const rankEmoji = rank === 1 ? '👑' : rank <= 4 ? '🔥' : rank <= 8 ? '⚡' : '📍';
        standingsText += `${rankEmoji} ${rank}. **${team.name}** (${record})\n`;
      });

      embed.setDescription(standingsText);
    }

    return embed;
  }

  // Utility methods for common embed types that we use throughout the bot

  static createSuccessEmbed(title: string, description?: string): VFLEmbedBuilder {
    return new VFLEmbedBuilder()
      .setColor(VFLColor.SUCCESS)
      .setTitle(`✅ **${title}**`)
      .setDescription(description || '')
      .setFooter('VFL Manager', 'https://example.com/vfl-logo.png');
  }

  static createErrorEmbed(title: string, description?: string): VFLEmbedBuilder {
    return new VFLEmbedBuilder()
      .setColor(VFLColor.ERROR)
      .setTitle(`❌ **${title}**`)
      .setDescription(description || '')
      .setFooter('VFL Manager', 'https://example.com/vfl-logo.png');
  }

  static createWarningEmbed(title: string, description?: string): VFLEmbedBuilder {
    return new VFLEmbedBuilder()
      .setColor(VFLColor.WARNING)
      .setTitle(`⚠️ **${title}**`)
      .setDescription(description || '')
      .setFooter('VFL Manager', 'https://example.com/vfl-logo.png');
  }

  static createInfoEmbed(title: string, description?: string): VFLEmbedBuilder {
    return new VFLEmbedBuilder()
      .setColor(VFLColor.INFO)
      .setTitle(`ℹ️ **${title}**`)
      .setDescription(description || '')
      .setFooter('VFL Manager', 'https://example.com/vfl-logo.png');
  }

  // Builder pattern methods for customizing embeds
  setTitle(title: string): this {
    this.embed.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.embed.description = description;
    return this;
  }

  setColor(color: VFLColor | number): this {
    this.embed.color = color;
    return this;
  }

  setThumbnail(url: string): this {
    this.embed.thumbnail = { url };
    return this;
  }

  setImage(url: string): this {
    this.embed.image = { url };
    return this;
  }

  setFooter(text: string, iconUrl?: string): this {
    this.embed.footer = { text };
    if (iconUrl) this.embed.footer.icon_url = iconUrl;
    return this;
  }

  addField(name: string, value: string, inline: boolean = false): this {
    if (!this.embed.fields) this.embed.fields = [];
    this.embed.fields.push({ name, value, inline });
    return this;
  }

  addFields(fields: APIEmbedField[]): this {
    if (!this.embed.fields) this.embed.fields = [];
    this.embed.fields.push(...fields);
    return this;
  }

  setTimestamp(timestamp?: Date): this {
    this.embed.timestamp = (timestamp || new Date()).toISOString();
    return this;
  }

  build(): APIEmbed {
    return this.embed;
  }
}