"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgressBar = exports.formatPercentage = exports.formatCurrency = exports.formatRecord = exports.formatTeamName = exports.formatPlayerName = exports.EmbedBuilder = exports.EmbedColor = void 0;
var EmbedColor;
(function (EmbedColor) {
    EmbedColor[EmbedColor["PRIMARY"] = 2067276] = "PRIMARY";
    EmbedColor[EmbedColor["SUCCESS"] = 5763719] = "SUCCESS";
    EmbedColor[EmbedColor["WARNING"] = 16705372] = "WARNING";
    EmbedColor[EmbedColor["ERROR"] = 15548997] = "ERROR";
    EmbedColor[EmbedColor["INFO"] = 5793266] = "INFO";
    EmbedColor[EmbedColor["SECONDARY"] = 10070709] = "SECONDARY";
    EmbedColor[EmbedColor["MADDEN"] = 16739125] = "MADDEN";
    EmbedColor[EmbedColor["TEAM_PRIMARY"] = 78697] = "TEAM_PRIMARY";
})(EmbedColor || (exports.EmbedColor = EmbedColor = {}));
class EmbedBuilder {
    embed = {};
    constructor() {
        this.embed.color = EmbedColor.PRIMARY;
        this.embed.timestamp = new Date().toISOString();
    }
    setTitle(title) {
        this.embed.title = title;
        return this;
    }
    setDescription(description) {
        this.embed.description = description;
        return this;
    }
    setColor(color) {
        this.embed.color = color;
        return this;
    }
    setThumbnail(url) {
        this.embed.thumbnail = { url };
        return this;
    }
    setImage(url) {
        this.embed.image = { url };
        return this;
    }
    setAuthor(name, iconUrl, url) {
        this.embed.author = { name };
        if (iconUrl)
            this.embed.author.icon_url = iconUrl;
        if (url)
            this.embed.author.url = url;
        return this;
    }
    setFooter(text, iconUrl) {
        this.embed.footer = { text };
        if (iconUrl)
            this.embed.footer.icon_url = iconUrl;
        return this;
    }
    addField(name, value, inline = false) {
        if (!this.embed.fields)
            this.embed.fields = [];
        this.embed.fields.push({ name, value, inline });
        return this;
    }
    addFields(fields) {
        if (!this.embed.fields)
            this.embed.fields = [];
        this.embed.fields.push(...fields);
        return this;
    }
    setTimestamp(timestamp) {
        this.embed.timestamp = (timestamp || new Date()).toISOString();
        return this;
    }
    build() {
        return this.embed;
    }
    // Utility methods for common embed types
    static success(title, description) {
        return new EmbedBuilder()
            .setColor(EmbedColor.SUCCESS)
            .setTitle(`✅ ${title}`)
            .setDescription(description || '');
    }
    static error(title, description) {
        return new EmbedBuilder()
            .setColor(EmbedColor.ERROR)
            .setTitle(`❌ ${title}`)
            .setDescription(description || '');
    }
    static warning(title, description) {
        return new EmbedBuilder()
            .setColor(EmbedColor.WARNING)
            .setTitle(`⚠️ ${title}`)
            .setDescription(description || '');
    }
    static info(title, description) {
        return new EmbedBuilder()
            .setColor(EmbedColor.INFO)
            .setTitle(`ℹ️ ${title}`)
            .setDescription(description || '');
    }
    static madden(title, description) {
        return new EmbedBuilder()
            .setColor(EmbedColor.MADDEN)
            .setTitle(`🏈 ${title}`)
            .setDescription(description || '')
            .setFooter('Snallabot Madden League', 'https://i.imgur.com/madden-logo.png');
    }
}
exports.EmbedBuilder = EmbedBuilder;
// Helper functions for formatting
function formatPlayerName(firstName, lastName, position) {
    return `**${firstName} ${lastName}** (${position})`;
}
exports.formatPlayerName = formatPlayerName;
function formatTeamName(cityName, teamName) {
    return `**${cityName} ${teamName}**`;
}
exports.formatTeamName = formatTeamName;
function formatRecord(wins, losses, ties = 0) {
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}
exports.formatRecord = formatRecord;
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
exports.formatCurrency = formatCurrency;
function formatPercentage(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}
exports.formatPercentage = formatPercentage;
function createProgressBar(current, max, length = 10) {
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
exports.createProgressBar = createProgressBar;
//# sourceMappingURL=embed_builder.js.map