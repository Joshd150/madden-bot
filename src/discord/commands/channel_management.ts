import { ParameterizedContext } from "koa"
import { CommandHandler, Command } from "../commands_handler"
import { respond, createMessageResponse, DiscordClient } from "../discord_utils"
import { APIApplicationCommandInteractionDataChannelOption, APIApplicationCommandInteractionDataStringOption, APIApplicationCommandInteractionDataSubcommandOption, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10"
import { Firestore } from "firebase-admin/firestore"
import { ChannelId, DiscordIdType, LeagueSettings } from "../settings_db"
import { EmbedBuilder, EmbedColor } from "../embeds/embed_builder"

export enum NotificationChannelType {
  ROSTER_UPDATES = "roster_updates",
  STATS_UPDATES = "stats_updates", 
  TRADES = "trades",
  FREE_AGENTS = "free_agents",
  INJURIES = "injuries",
  CONTRACTS = "contracts",
  DRAFT = "draft",
  PLAYOFFS = "playoffs"
}

export type NotificationChannels = {
  [key in NotificationChannelType]?: ChannelId
}

export type ChannelManagementConfiguration = {
  notification_channels: NotificationChannels
}

const CHANNEL_TYPE_DESCRIPTIONS = {
  [NotificationChannelType.ROSTER_UPDATES]: "Player roster changes, signings, and releases",
  [NotificationChannelType.STATS_UPDATES]: "Weekly player and team statistics updates",
  [NotificationChannelType.TRADES]: "Trade announcements and transaction details",
  [NotificationChannelType.FREE_AGENTS]: "Free agency signings and player movements",
  [NotificationChannelType.INJURIES]: "Player injury reports and status updates",
  [NotificationChannelType.CONTRACTS]: "Contract extensions, negotiations, and salary cap news",
  [NotificationChannelType.DRAFT]: "Draft picks, rookie signings, and draft analysis",
  [NotificationChannelType.PLAYOFFS]: "Playoff brackets, results, and championship updates"
};

const CHANNEL_TYPE_EMOJIS = {
  [NotificationChannelType.ROSTER_UPDATES]: "👥",
  [NotificationChannelType.STATS_UPDATES]: "📊",
  [NotificationChannelType.TRADES]: "🔄",
  [NotificationChannelType.FREE_AGENTS]: "🆓",
  [NotificationChannelType.INJURIES]: "🏥",
  [NotificationChannelType.CONTRACTS]: "💰",
  [NotificationChannelType.DRAFT]: "🎯",
  [NotificationChannelType.PLAYOFFS]: "🏆"
};

function createChannelListEmbed(channels: NotificationChannels): EmbedBuilder {
  const embed = EmbedBuilder.madden("📢 Notification Channels", "Current channel assignments for league notifications");
  
  let hasChannels = false;
  
  Object.entries(CHANNEL_TYPE_DESCRIPTIONS).forEach(([type, description]) => {
    const channelType = type as NotificationChannelType;
    const channel = channels[channelType];
    const emoji = CHANNEL_TYPE_EMOJIS[channelType];
    
    if (channel) {
      embed.addField(
        `${emoji} ${type.replace('_', ' ').toUpperCase()}`,
        `<#${channel.id}>\n*${description}*`,
        true
      );
      hasChannels = true;
    }
  });
  
  if (!hasChannels) {
    embed.setDescription("No notification channels have been configured yet.\nUse `/set-channel` to assign channels for different notification types.");
    embed.setColor(EmbedColor.WARNING);
  }
  
  return embed;
}

export default {
  async handleCommand(command: Command, client: DiscordClient, db: Firestore, ctx: ParameterizedContext) {
    const { guild_id } = command;
    
    if (!command.data.options) {
      throw new Error("Channel management command not configured properly");
    }
    
    const subCommand = command.data.options[0] as APIApplicationCommandInteractionDataSubcommandOption;
    const subCommandName = subCommand.name;
    
    const doc = await db.collection("league_settings").doc(guild_id).get();
    const leagueSettings = doc.exists ? doc.data() as LeagueSettings : {} as LeagueSettings;
    
    if (subCommandName === "set") {
      if (!subCommand.options || subCommand.options.length < 2) {
        throw new Error("Set channel command missing required parameters");
      }
      
      const channelType = (subCommand.options[0] as APIApplicationCommandInteractionDataStringOption).value as NotificationChannelType;
      const channelId = (subCommand.options[1] as APIApplicationCommandInteractionDataChannelOption).value;
      
      if (!Object.values(NotificationChannelType).includes(channelType)) {
        throw new Error(`Invalid channel type: ${channelType}`);
      }
      
      const channelConfig: ChannelManagementConfiguration = {
        notification_channels: {
          ...leagueSettings.commands?.channel_management?.notification_channels,
          [channelType]: { id: channelId, id_type: DiscordIdType.CHANNEL }
        }
      };
      
      await db.collection("league_settings").doc(guild_id).set({
        commands: {
          channel_management: channelConfig
        }
      }, { merge: true });
      
      const embed = EmbedBuilder.success(
        "Channel Set Successfully",
        `${CHANNEL_TYPE_EMOJIS[channelType]} **${channelType.replace('_', ' ').toUpperCase()}** notifications will now be sent to <#${channelId}>`
      ).addField(
        "Description",
        CHANNEL_TYPE_DESCRIPTIONS[channelType],
        false
      );
      
      respond(ctx, {
        type: 4,
        data: {
          embeds: [embed.build()]
        }
      });
      
    } else if (subCommandName === "list") {
      const channels = leagueSettings.commands?.channel_management?.notification_channels || {};
      const embed = createChannelListEmbed(channels);
      
      respond(ctx, {
        type: 4,
        data: {
          embeds: [embed.build()]
        }
      });
      
    } else if (subCommandName === "remove") {
      if (!subCommand.options || subCommand.options.length < 1) {
        throw new Error("Remove channel command missing channel type parameter");
      }
      
      const channelType = (subCommand.options[0] as APIApplicationCommandInteractionDataStringOption).value as NotificationChannelType;
      
      if (!Object.values(NotificationChannelType).includes(channelType)) {
        throw new Error(`Invalid channel type: ${channelType}`);
      }
      
      const currentChannels = leagueSettings.commands?.channel_management?.notification_channels || {};
      
      if (!currentChannels[channelType]) {
        const embed = EmbedBuilder.warning(
          "Channel Not Set",
          `No channel is currently assigned for **${channelType.replace('_', ' ').toUpperCase()}** notifications.`
        );
        
        respond(ctx, {
          type: 4,
          data: {
            embeds: [embed.build()]
          }
        });
        return;
      }
      
      delete currentChannels[channelType];
      
      const channelConfig: ChannelManagementConfiguration = {
        notification_channels: currentChannels
      };
      
      await db.collection("league_settings").doc(guild_id).set({
        commands: {
          channel_management: channelConfig
        }
      }, { merge: true });
      
      const embed = EmbedBuilder.success(
        "Channel Removed",
        `${CHANNEL_TYPE_EMOJIS[channelType]} **${channelType.replace('_', ' ').toUpperCase()}** notifications have been disabled.`
      );
      
      respond(ctx, {
        type: 4,
        data: {
          embeds: [embed.build()]
        }
      });
    }
  },
  
  commandDefinition(): RESTPostAPIApplicationCommandsJSONBody {
    return {
      name: "set-channel",
      description: "Manage notification channels for different league events",
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "set",
          description: "Set a notification channel for a specific event type",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "type",
              description: "Type of notifications for this channel",
              required: true,
              choices: Object.entries(NotificationChannelType).map(([key, value]) => ({
                name: `${CHANNEL_TYPE_EMOJIS[value]} ${key.replace('_', ' ')}`,
                value: value
              }))
            },
            {
              type: ApplicationCommandOptionType.Channel,
              name: "channel",
              description: "Channel to receive notifications",
              required: true,
              channel_types: [ChannelType.GuildText, ChannelType.GuildNews]
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "list",
          description: "List all configured notification channels",
          options: []
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "remove",
          description: "Remove a notification channel assignment",
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "type",
              description: "Type of notifications to disable",
              required: true,
              choices: Object.entries(NotificationChannelType).map(([key, value]) => ({
                name: `${CHANNEL_TYPE_EMOJIS[value]} ${key.replace('_', ' ')}`,
                value: value
              }))
            }
          ]
        }
      ]
    };
  }
} as CommandHandler;