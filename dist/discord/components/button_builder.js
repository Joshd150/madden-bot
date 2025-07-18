"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRowBuilder = exports.SelectMenuBuilder = exports.ButtonBuilder = void 0;
const v10_1 = require("discord-api-types/v10");
class ButtonBuilder {
    button = {
        type: v10_1.ComponentType.Button,
        style: v10_1.ButtonStyle.Primary,
        label: '',
        custom_id: ''
    };
    setCustomId(customId) {
        this.button.custom_id = customId;
        return this;
    }
    setLabel(label) {
        this.button.label = label;
        return this;
    }
    setStyle(style) {
        this.button.style = style;
        return this;
    }
    setEmoji(emoji) {
        this.button.emoji = { name: emoji };
        return this;
    }
    setDisabled(disabled = true) {
        this.button.disabled = disabled;
        return this;
    }
    setUrl(url) {
        this.button.style = v10_1.ButtonStyle.Link;
        this.button.url = url;
        delete this.button.custom_id;
        return this;
    }
    build() {
        return this.button;
    }
    // Utility methods for common button types
    static primary(label, customId) {
        return new ButtonBuilder()
            .setStyle(v10_1.ButtonStyle.Primary)
            .setLabel(label)
            .setCustomId(customId);
    }
    static secondary(label, customId) {
        return new ButtonBuilder()
            .setStyle(v10_1.ButtonStyle.Secondary)
            .setLabel(label)
            .setCustomId(customId);
    }
    static success(label, customId) {
        return new ButtonBuilder()
            .setStyle(v10_1.ButtonStyle.Success)
            .setLabel(label)
            .setCustomId(customId);
    }
    static danger(label, customId) {
        return new ButtonBuilder()
            .setStyle(v10_1.ButtonStyle.Danger)
            .setLabel(label)
            .setCustomId(customId);
    }
    static link(label, url) {
        return new ButtonBuilder()
            .setStyle(v10_1.ButtonStyle.Link)
            .setLabel(label)
            .setUrl(url);
    }
}
exports.ButtonBuilder = ButtonBuilder;
class SelectMenuBuilder {
    selectMenu = {
        type: v10_1.ComponentType.StringSelect,
        custom_id: '',
        options: [],
        placeholder: 'Select an option...'
    };
    setCustomId(customId) {
        this.selectMenu.custom_id = customId;
        return this;
    }
    setPlaceholder(placeholder) {
        this.selectMenu.placeholder = placeholder;
        return this;
    }
    setMinValues(minValues) {
        this.selectMenu.min_values = minValues;
        return this;
    }
    setMaxValues(maxValues) {
        this.selectMenu.max_values = maxValues;
        return this;
    }
    addOption(label, value, description, emoji, isDefault) {
        const option = { label, value };
        if (description)
            option.description = description;
        if (emoji)
            option.emoji = { name: emoji };
        if (isDefault)
            option.default = true;
        this.selectMenu.options.push(option);
        return this;
    }
    addOptions(options) {
        options.forEach(option => this.addOption(option.label, option.value, option.description, option.emoji, option.isDefault));
        return this;
    }
    build() {
        return this.selectMenu;
    }
}
exports.SelectMenuBuilder = SelectMenuBuilder;
class ActionRowBuilder {
    components = [];
    addComponents(...components) {
        this.components.push(...components);
        return this;
    }
    build() {
        return {
            type: v10_1.ComponentType.ActionRow,
            components: this.components
        };
    }
}
exports.ActionRowBuilder = ActionRowBuilder;
//# sourceMappingURL=button_builder.js.map