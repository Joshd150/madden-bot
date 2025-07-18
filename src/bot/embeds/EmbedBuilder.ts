import { EmbedBuilder as DiscordEmbedBuilder, ColorResolvable } from 'discord.js';
import { config } from '../../config';

/**
 * Custom embed builder that creates consistent, professional-looking embeds
 * for all bot responses. This ensures a cohesive visual experience across
 * all commands and automated posts.
 */
export class CustomEmbedBuilder {
  private embed: DiscordEmbedBuilder;

  constructor() {
    this.embed = new DiscordEmbedBuilder();
    // Set default styling that matches our sports theme
    this.embed.setColor(config.bot.defaultEmbedColor as ColorResolvable);
    this.embed.setTimestamp();
  }

  /**
   * Creates a trade announcement embed with professional formatting
   * This is used for automated trade posts and manual trade commands
   */
  static createTradeEmbed(trade: any): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#ff6b35') // Orange color for trades to make them stand out
      .setTitle('🔄 **TRADE ALERT**')
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Trading Hub', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    // Add team logos as thumbnails if available
    if (trade.fromTeam?.logoUrl) {
      embed.setThumbnail(trade.fromTeam.logoUrl);
    }

    // Create detailed trade description with proper formatting
    let description = `**${trade.fromTeam?.name}** ↔️ **${trade.toTeam?.name}**\n\n`;
    
    // Add players involved in the trade
    if (trade.players && trade.players.length > 0) {
      description += '**Players Involved:**\n';
      trade.players.forEach((player: any) => {
        description += `• ${player.name} (${player.position}) - ${player.fromTeam} → ${player.toTeam}\n`;
      });
    }

    // Add draft picks if any
    if (trade.draftPicks && trade.draftPicks.length > 0) {
      description += '\n**Draft Picks:**\n';
      trade.draftPicks.forEach((pick: any) => {
        description += `• ${pick.year} ${pick.round} Round Pick\n`;
      });
    }

    // Add trade analysis if available
    if (trade.analysis) {
      description += `\n**Analysis:** ${trade.analysis}`;
    }

    embed.setDescription(description);

    return embed;
  }

  /**
   * Creates a game score embed with comprehensive game information
   * Used for posting game results and live score updates
   */
  static createGameEmbed(game: any): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#1f8b4c') // Green color for completed games
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • Game Center', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    // Set title based on game status
    if (game.status === 'completed') {
      embed.setTitle('🏆 **FINAL SCORE**');
    } else if (game.status === 'in_progress') {
      embed.setTitle('🔴 **LIVE GAME**');
      embed.setColor('#ff0000'); // Red for live games
    } else {
      embed.setTitle('📅 **UPCOMING GAME**');
      embed.setColor('#ffa500'); // Orange for scheduled games
    }

    // Create score display with team logos
    let scoreDisplay = '';
    if (game.status === 'completed' || game.status === 'in_progress') {
      scoreDisplay = `**${game.awayTeam.name}** ${game.awayScore} - ${game.homeScore} **${game.homeTeam.name}**`;
    } else {
      scoreDisplay = `**${game.awayTeam.name}** @ **${game.homeTeam.name}**`;
    }

    embed.setDescription(scoreDisplay);

    // Add game details as fields
    embed.addFields(
      { 
        name: '📅 Date & Time', 
        value: new Date(game.gameDate).toLocaleString(), 
        inline: true 
      },
      { 
        name: '🏟️ Week', 
        value: `Week ${game.week}`, 
        inline: true 
      }
    );

    // Add team logos as thumbnail and image
    if (game.homeTeam?.logoUrl) {
      embed.setThumbnail(game.homeTeam.logoUrl);
    }

    return embed;
  }

  /**
   * Creates a detailed game breakdown embed with comprehensive statistics
   * This is used for the advanced game analysis command
   */
  static createGameBreakdownEmbed(game: any, stats: any): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#4169e1') // Royal blue for detailed analysis
      .setTitle('📊 **GAME BREAKDOWN**')
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • Advanced Analytics', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    // Game header with final score
    const gameHeader = `**${game.awayTeam.name}** ${game.awayScore} - ${game.homeScore} **${game.homeTeam.name}**\n` +
                      `Week ${game.week} • ${new Date(game.gameDate).toLocaleDateString()}`;
    
    embed.setDescription(gameHeader);

    // Offensive statistics comparison
    if (stats.offense) {
      let offenseStats = '';
      offenseStats += `**Total Yards:**\n${game.awayTeam.abbreviation}: ${stats.offense.away.totalYards} | ${game.homeTeam.abbreviation}: ${stats.offense.home.totalYards}\n\n`;
      offenseStats += `**Passing Yards:**\n${game.awayTeam.abbreviation}: ${stats.offense.away.passingYards} | ${game.homeTeam.abbreviation}: ${stats.offense.home.passingYards}\n\n`;
      offenseStats += `**Rushing Yards:**\n${game.awayTeam.abbreviation}: ${stats.offense.away.rushingYards} | ${game.homeTeam.abbreviation}: ${stats.offense.home.rushingYards}`;
      
      embed.addFields({ 
        name: '⚡ Offensive Statistics', 
        value: offenseStats, 
        inline: false 
      });
    }

    // Defensive statistics
    if (stats.defense) {
      let defenseStats = '';
      defenseStats += `**Sacks:**\n${game.awayTeam.abbreviation}: ${stats.defense.away.sacks} | ${game.homeTeam.abbreviation}: ${stats.defense.home.sacks}\n\n`;
      defenseStats += `**Interceptions:**\n${game.awayTeam.abbreviation}: ${stats.defense.away.interceptions} | ${game.homeTeam.abbreviation}: ${stats.defense.home.interceptions}\n\n`;
      defenseStats += `**Fumbles Recovered:**\n${game.awayTeam.abbreviation}: ${stats.defense.away.fumbles} | ${game.homeTeam.abbreviation}: ${stats.defense.home.fumbles}`;
      
      embed.addFields({ 
        name: '🛡️ Defensive Statistics', 
        value: defenseStats, 
        inline: false 
      });
    }

    // Key players performance
    if (stats.keyPlayers) {
      let keyPlayersText = '';
      stats.keyPlayers.forEach((player: any) => {
        keyPlayersText += `**${player.name}** (${player.team})\n${player.stats}\n\n`;
      });
      
      embed.addFields({ 
        name: '⭐ Key Performances', 
        value: keyPlayersText, 
        inline: false 
      });
    }

    return embed;
  }

  /**
   * Creates a player statistics embed with comprehensive player data
   * Used for player lookup commands and player-focused content
   */
  static createPlayerEmbed(player: any): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#9932cc') // Purple for player profiles
      .setTitle(`👤 **${player.name}**`)
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • Player Database', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    // Player basic information
    let playerInfo = `**Position:** ${player.position}\n`;
    playerInfo += `**Team:** ${player.team?.name || 'Free Agent'}\n`;
    playerInfo += `**Jersey #:** ${player.jerseyNumber || 'N/A'}\n`;
    playerInfo += `**Age:** ${player.age || 'N/A'}\n`;
    
    if (player.height) playerInfo += `**Height:** ${player.height}\n`;
    if (player.weight) playerInfo += `**Weight:** ${player.weight} lbs\n`;
    if (player.college) playerInfo += `**College:** ${player.college}\n`;
    if (player.yearsPro) playerInfo += `**Years Pro:** ${player.yearsPro}\n`;

    embed.setDescription(playerInfo);

    // Contract information if available
    if (player.salary || player.contractYears) {
      let contractInfo = '';
      if (player.salary) contractInfo += `**Salary:** $${player.salary.toLocaleString()}\n`;
      if (player.contractYears) contractInfo += `**Contract:** ${player.contractYears} years\n`;
      
      embed.addFields({ 
        name: '💰 Contract Details', 
        value: contractInfo, 
        inline: true 
      });
    }

    // Season statistics if available
    if (player.stats) {
      let statsText = '';
      Object.entries(player.stats).forEach(([key, value]) => {
        statsText += `**${key}:** ${value}\n`;
      });
      
      embed.addFields({ 
        name: '📈 Season Stats', 
        value: statsText, 
        inline: true 
      });
    }

    // Add team logo as thumbnail if available
    if (player.team?.logoUrl) {
      embed.setThumbnail(player.team.logoUrl);
    }

    return embed;
  }

  /**
   * Creates a team overview embed with team statistics and roster highlights
   * Used for team information commands and team-focused content
   */
  static createTeamEmbed(team: any): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor(team.primaryColor || '#1f8b4c')
      .setTitle(`🏈 **${team.city} ${team.name}**`)
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • Team Database', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    // Team basic information
    let teamInfo = `**Conference:** ${team.conference || 'N/A'}\n`;
    teamInfo += `**Division:** ${team.division || 'N/A'}\n`;
    
    if (team.record) {
      teamInfo += `**Record:** ${team.record.wins}-${team.record.losses}`;
      if (team.record.ties > 0) teamInfo += `-${team.record.ties}`;
      teamInfo += '\n';
    }

    embed.setDescription(teamInfo);

    // Team statistics if available
    if (team.stats) {
      let statsText = '';
      if (team.stats.pointsFor) statsText += `**Points For:** ${team.stats.pointsFor}\n`;
      if (team.stats.pointsAgainst) statsText += `**Points Against:** ${team.stats.pointsAgainst}\n`;
      if (team.stats.totalYards) statsText += `**Total Yards:** ${team.stats.totalYards}\n`;
      if (team.stats.yardsAllowed) statsText += `**Yards Allowed:** ${team.stats.yardsAllowed}\n`;
      
      embed.addFields({ 
        name: '📊 Team Stats', 
        value: statsText, 
        inline: true 
      });
    }

    // Recent games if available
    if (team.recentGames && team.recentGames.length > 0) {
      let recentGamesText = '';
      team.recentGames.slice(0, 3).forEach((game: any) => {
        const result = game.homeTeamId === team.id 
          ? (game.homeScore > game.awayScore ? 'W' : 'L')
          : (game.awayScore > game.homeScore ? 'W' : 'L');
        recentGamesText += `${result} vs ${game.opponent} (${game.score})\n`;
      });
      
      embed.addFields({ 
        name: '🎯 Recent Games', 
        value: recentGamesText, 
        inline: true 
      });
    }

    // Add team logo
    if (team.logoUrl) {
      embed.setThumbnail(team.logoUrl);
    }

    return embed;
  }

  /**
   * Creates a league standings embed with formatted standings table
   * Used for standings commands and league overview content
   */
  static createStandingsEmbed(standings: any[], conference?: string): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#ffd700') // Gold color for standings
      .setTitle(`🏆 **${conference ? conference.toUpperCase() + ' ' : ''}STANDINGS**`)
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • League Standings', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    // Group standings by division if conference is specified
    if (conference) {
      const divisions = [...new Set(standings.map(team => team.division))];
      
      divisions.forEach(division => {
        const divisionTeams = standings
          .filter(team => team.division === division)
          .sort((a, b) => {
            // Sort by wins, then by win percentage, then by points for
            if (a.wins !== b.wins) return b.wins - a.wins;
            const aWinPct = a.wins / (a.wins + a.losses + (a.ties || 0));
            const bWinPct = b.wins / (b.wins + b.losses + (b.ties || 0));
            if (aWinPct !== bWinPct) return bWinPct - aWinPct;
            return (b.pointsFor || 0) - (a.pointsFor || 0);
          });

        let divisionText = '';
        divisionTeams.forEach((team, index) => {
          const record = `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`;
          divisionText += `${index + 1}. **${team.name}** (${record})\n`;
        });

        embed.addFields({ 
          name: `${division} Division`, 
          value: divisionText, 
          inline: true 
        });
      });
    } else {
      // Show overall league standings
      let standingsText = '';
      standings.slice(0, 16).forEach((team, index) => {
        const record = `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ''}`;
        standingsText += `${index + 1}. **${team.name}** (${record})\n`;
      });

      embed.setDescription(standingsText);
    }

    return embed;
  }

  /**
   * Creates an error embed for consistent error messaging
   * This ensures all errors are displayed in a user-friendly way
   */
  static createErrorEmbed(message: string, details?: string): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#ff0000') // Red for errors
      .setTitle('❌ **Error**')
      .setDescription(message)
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • Error Handler', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    if (details) {
      embed.addFields({ 
        name: 'Details', 
        value: details, 
        inline: false 
      });
    }

    return embed;
  }

  /**
   * Creates a success embed for positive confirmations
   * Used when commands execute successfully
   */
  static createSuccessEmbed(message: string, details?: string): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#00ff00') // Green for success
      .setTitle('✅ **Success**')
      .setDescription(message)
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • Success', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    if (details) {
      embed.addFields({ 
        name: 'Details', 
        value: details, 
        inline: false 
      });
    }

    return embed;
  }

  /**
   * Creates an info embed for general information
   * Used for help commands and informational responses
   */
  static createInfoEmbed(title: string, message: string): DiscordEmbedBuilder {
    const embed = new DiscordEmbedBuilder()
      .setColor('#0099ff') // Blue for information
      .setTitle(`ℹ️ **${title}**`)
      .setDescription(message)
      .setTimestamp()
      .setFooter({ 
        text: 'Sports Hub • Information', 
        iconURL: 'https://cdn.discordapp.com/attachments/your-icon-url.png' 
      });

    return embed;
  }

  // Getter methods for the internal embed builder
  setTitle(title: string): this {
    this.embed.setTitle(title);
    return this;
  }

  setDescription(description: string): this {
    this.embed.setDescription(description);
    return this;
  }

  setColor(color: ColorResolvable): this {
    this.embed.setColor(color);
    return this;
  }

  addFields(...fields: any[]): this {
    this.embed.addFields(...fields);
    return this;
  }

  setThumbnail(url: string): this {
    this.embed.setThumbnail(url);
    return this;
  }

  setImage(url: string): this {
    this.embed.setImage(url);
    return this;
  }

  setFooter(options: { text: string; iconURL?: string }): this {
    this.embed.setFooter(options);
    return this;
  }

  build(): DiscordEmbedBuilder {
    return this.embed;
  }
}