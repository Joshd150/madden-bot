import { APIEmbed, APIEmbedField } from "discord-api-types/v10";

export enum EmbedColor {
  PRIMARY = 0x1f8b4c,      // Green
  SUCCESS = 0x57f287,      // Light Green
  WARNING = 0xfee75c,      // Yellow
  ERROR = 0xed4245,        // Red
  INFO = 0x5865f2,         // Blurple
  SECONDARY = 0x99aab5,    // Gray
  MADDEN = 0xff6b35,       // Madden Orange
  TEAM_PRIMARY = 0x013369, // NFL Blue
}

export class EmbedBuilder {
  private embed: APIEmbed = {};

  constructor() {
    this.embed.color = EmbedColor.PRIMARY;
    this.embed.timestamp = new Date().toISOString();
  }

  setTitle(title: string): this {
    this.embed.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.embed.description = description;
    return this;
  }

  setColor(color: EmbedColor | number): this {
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

  setAuthor(name: string, iconUrl?: string, url?: string): this {
    this.embed.author = { name };
    if (iconUrl) this.embed.author.icon_url = iconUrl;
    if (url) this.embed.author.url = url;
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

  // Utility methods for common embed types
  static success(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(EmbedColor.SUCCESS)
      .setTitle(`✅ ${title}`)
      .setDescription(description || '');
  }

  static error(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(EmbedColor.ERROR)
      .setTitle(`❌ ${title}`)
      .setDescription(description || '');
  }

  static warning(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(EmbedColor.WARNING)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description || '');
  }

  static info(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(EmbedColor.INFO)
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description || '');
  }

  static madden(title: string, description?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(EmbedColor.MADDEN)
      .setTitle(`🏈 ${title}`)
      .setDescription(description || '')
      .setFooter('Snallabot Madden League', 'https://i.imgur.com/madden-logo.png');
  }
}

// Helper functions for formatting
export function formatPlayerName(firstName: string, lastName: string, position: string): string {
  return `**${firstName} ${lastName}** (${position})`;
}

export function formatTeamName(cityName: string, teamName: string): string {
  return `**${cityName} ${teamName}**`;
}

export function formatRecord(wins: number, losses: number, ties: number = 0): string {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function createProgressBar(current: number, max: number, length: number = 10): string {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}