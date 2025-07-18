import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../commands_handler"
import { respond, DiscordClient, deferMessage } from "../discord_utils"
import { APIApplicationCommandInteractionDataIntegerOption, APIApplicationCommandInteractionDataStringOption, APIApplicationCommandInteractionDataSubcommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Firestore } from "firebase-admin/firestore"
import { LeagueSettings } from "../settings_db"
import MaddenDB from "../../db/madden_db"
import { EmbedBuilder, EmbedColor, formatCurrency, formatPercentage, createProgressBar } from "../embeds/embed_builder"
import { ButtonBuilder, ActionRowBuilder } from "../components/button_builder"
import { Player, Standing, POSITIONS } from "../../export/madden_league_types"

async function handleSalaryCap(client: DiscordClient, token: string, leagueId: string, teamName?: string) {
  try {
    const teams = await MaddenDB.getLatestTeams(leagueId);
    const standings = await MaddenDB.getLatestStandings(leagueId);
    
    let teamsToShow = teams.getLatestTeams();
    if (teamName) {
      teamsToShow = teamsToShow.filter(team => 
        team.displayName.toLowerCase().includes(teamName.toLowerCase()) ||
        team.cityName.toLowerCase().includes(teamName.toLowerCase()) ||
        team.abbrName.toLowerCase().includes(teamName.toLowerCase())
      );
    }
    
    if (teamsToShow.length === 0) {
      await client.editOriginalInteraction(token, {
        embeds: [EmbedBuilder.error("Team Not Found", `No team found matching "${teamName}"`).build()]
      });
      return;
    }
    
    const embed = EmbedBuilder.madden("💰 Salary Cap Information", 
      teamName ? `Salary cap details for ${teamsToShow[0].displayName}` : "League-wide salary cap overview"
    );
    
    teamsToShow.slice(0, 10).forEach(team => {
      const standing = standings.find(s => s.teamId === team.teamId);
      if (standing) {
        const capUsed = standing.capSpent;
        const capAvailable = standing.capAvailable;
        const totalCap = capUsed + capAvailable;
        const capPercentage = capUsed / totalCap;
        
        embed.addField(
          `${team.displayName}`,
          `**Used:** ${formatCurrency(capUsed)} (${formatPercentage(capPercentage)})\n` +
          `**Available:** ${formatCurrency(capAvailable)}\n` +
          `**Total:** ${formatCurrency(totalCap)}\n` +
          `${createProgressBar(capUsed, totalCap, 8)}`,
          true
        );
      }
    });
    
    await client.editOriginalInteraction(token, {
      embeds: [embed.build()]
    });
    
  } catch (error) {
    await client.editOriginalInteraction(token, {
      embeds: [EmbedBuilder.error("Salary Cap Error", `Failed to retrieve salary cap data: ${error}`).build()]
    });
  }
}

async function handleLeagueLeaders(client: DiscordClient, token: string, leagueId: string, statCategory: string) {
  try {
    const players = await MaddenDB.getLatestPlayers(leagueId);
    const teams = await MaddenDB.getLatestTeams(leagueId);
    
    // Get detailed stats for top players based on category
    let sortedPlayers: Player[] = [];
    let statTitle = "";
    let statFormatter = (value: number) => value.toString();
    
    switch (statCategory.toLowerCase()) {
      case "overall":
        sortedPlayers = players.sort((a, b) => b.playerBestOvr - a.playerBestOvr);
        statTitle = "Overall Rating";
        break;
      case "speed":
        sortedPlayers = players.sort((a, b) => b.speedRating - a.speedRating);
        statTitle = "Speed Rating";
        break;
      case "strength":
        sortedPlayers = players.sort((a, b) => b.strengthRating - a.strengthRating);
        statTitle = "Strength Rating";
        break;
      case "awareness":
        sortedPlayers = players.sort((a, b) => b.awareRating - a.awareRating);
        statTitle = "Awareness Rating";
        break;
      case "salary":
        sortedPlayers = players.sort((a, b) => b.contractSalary - a.contractSalary);
        statTitle = "Contract Salary";
        statFormatter = (value: number) => formatCurrency(value);
        break;
      default:
        await client.editOriginalInteraction(token, {
          embeds: [EmbedBuilder.error("Invalid Category", `Unknown stat category: ${statCategory}`).build()]
        });
        return;
    }
    
    const embed = EmbedBuilder.madden(`🏆 League Leaders - ${statTitle}`, 
      `Top 10 players by ${statTitle.toLowerCase()}`
    );
    
    sortedPlayers.slice(0, 10).forEach((player, index) => {
      const team = teams.getTeamForId(player.teamId);
      let statValue: number;
      
      switch (statCategory.toLowerCase()) {
        case "overall":
          statValue = player.playerBestOvr;
          break;
        case "speed":
          statValue = player.speedRating;
          break;
        case "strength":
          statValue = player.strengthRating;
          break;
        case "awareness":
          statValue = player.awareRating;
          break;
        case "salary":
          statValue = player.contractSalary;
          break;
        default:
          statValue = 0;
      }
      
      const medal = index < 3 ? ["🥇", "🥈", "🥉"][index] : `${index + 1}.`;
      
      embed.addField(
        `${medal} ${player.firstName} ${player.lastName}`,
        `**${player.position}** - ${team.displayName}\n` +
        `**${statTitle}:** ${statFormatter(statValue)}`,
        true
      );
    });
    
    const buttons = new ActionRowBuilder()
      .addComponents(
        ButtonBuilder.secondary("Overall", `league_leaders_overall_${leagueId}`).build(),
        ButtonBuilder.secondary("Speed", `league_leaders_speed_${leagueId}`).build(),
        ButtonBuilder.secondary("Strength", `league_leaders_strength_${leagueId}`).build(),
        ButtonBuilder.secondary("Salary", `league_leaders_salary_${leagueId}`).build()
      );
    
    await client.editOriginalInteraction(token, {
      embeds: [embed.build()],
      components: [buttons.build()]
    });
    
  } catch (error) {
    await client.editOriginalInteraction(token, {
      embeds: [EmbedBuilder.error("League Leaders Error", `Failed to retrieve league leaders: ${error}`).build()]
    });
  }
}

async function handleFreeAgents(client: DiscordClient, token: string, leagueId: string, position?: string, limit: number = 20) {
  try {
    const freeAgents = await MaddenDB.getPlayers(leagueId, { 
      teamId: 0,
      position: position 
    }, limit);
    
    if (freeAgents.length === 0) {
      await client.editOriginalInteraction(token, {
        embeds: [EmbedBuilder.warning("No Free Agents", 
          position ? `No free agents found at ${position} position` : "No free agents available"
        ).build()]
      });
      return;
    }
    
    const embed = EmbedBuilder.madden("🆓 Free Agents", 
      position ? `Available ${position} players` : "Available free agents"
    );
    
    freeAgents.slice(0, 15).forEach((player, index) => {
      embed.addField(
        `${player.firstName} ${player.lastName} (${player.position})`,
        `**Overall:** ${player.playerBestOvr} | **Age:** ${player.age}\n` +
        `**Desired Salary:** ${formatCurrency(player.desiredSalary)}\n` +
        `**Years Pro:** ${player.yearsPro}`,
        true
      );
    });
    
    if (freeAgents.length > 15) {
      embed.setFooter(`Showing 15 of ${freeAgents.length} free agents`);
    }
    
    // Add position filter buttons
    const positionButtons = new ActionRowBuilder()
      .addComponents(
        ButtonBuilder.secondary("QB", `free_agents_QB_${leagueId}`).build(),
        ButtonBuilder.secondary("RB", `free_agents_HB_${leagueId}`).build(),
        ButtonBuilder.secondary("WR", `free_agents_WR_${leagueId}`).build(),
        ButtonBuilder.secondary("All", `free_agents_all_${leagueId}`).build()
      );
    
    await client.editOriginalInteraction(token, {
      embeds: [embed.build()],
      components: [positionButtons.build()]
    });
    
  } catch (error) {
    await client.editOriginalInteraction(token, {
      embeds: [EmbedBuilder.error("Free Agents Error", `Failed to retrieve free agents: ${error}`).build()]
    });
  }
}

export default {
  async handleCommand(command: Command, client: DiscordClient, db: Firestore, ctx: ParameterizedContext) {
    const { guild_id, token } = command;
    
    if (!command.data.options) {
      throw new Error("Advanced stats command not configured properly");
    }
    
    const doc = await db.collection("league_settings").doc(guild_id).get();
    const leagueSettings = doc.exists ? doc.data() as LeagueSettings : {} as LeagueSettings;
    
    if (!leagueSettings?.commands?.madden_league?.league_id) {
      throw new Error("No Madden league linked. Setup Snallabot with your Madden league first.");
    }
    
    const leagueId = leagueSettings.commands.madden_league.league_id;
    const subCommand = command.data.options[0] as APIApplicationCommandInteractionDataSubcommandOption;
    const subCommandName = subCommand.name;
    
    respond(ctx, deferMessage());
    
    switch (subCommandName) {
      case "salary-cap":
        const teamName = (subCommand.options?.[0] as APIApplicationCommandInteractionDataStringOption)?.value;
        await handleSalaryCap(client, token, leagueId, teamName);
        break;
        
      case "league-leaders":
        const statCategory = (subCommand.options?.[0] as APIApplicationCommandInteractionDataStringOption)?.value || "overall";
        await handleLeagueLeaders(client, token, leagueId, statCategory);
        break;
        
      case "free-agents":
        const position = (subCommand.options?.[0] as APIApplicationCommandInteractionDataStringOption)?.value;
        const limit = (subCommand.options?.[1] as APIApplicationCommandInteractionDataIntegerOption)?.value || 20;
        await handleFreeAgents(client, token, leagueId, position, limit);
        break;
        
      default:
        await client.editOriginalInteraction(token, {
          embeds: [EmbedBuilder.error("Unknown Command", `Unknown subcommand: ${subCommandName}`).build()]
        });
    }
  },
  
  commandDefinition(): RESTPostAPIApplicationCommandsJSONBody {
    return {
      name: "advanced-stats",
      description: "Advanced league statistics and data analysis",
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "salary-cap",
          description: "View salary cap information for teams",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "team",
              description: "Specific team to view (optional)",
              required: false
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "league-leaders",
          description: "View league leaders in various statistical categories",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "category",
              description: "Statistical category to view leaders for",
              required: false,
              choices: [
                { name: "Overall Rating", value: "overall" },
                { name: "Speed", value: "speed" },
                { name: "Strength", value: "strength" },
                { name: "Awareness", value: "awareness" },
                { name: "Contract Salary", value: "salary" }
              ]
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "free-agents",
          description: "View available free agents",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "position",
              description: "Filter by position",
              required: false,
              choices: POSITIONS.map(pos => ({ name: pos, value: pos }))
            },
            {
              type: ApplicationCommandOptionType.Integer,
              name: "limit",
              description: "Number of players to show (default: 20)",
              required: false,
              min_value: 5,
              max_value: 50
            }
          ]
        }
      ]
    };
  }
} as CommandHandler;