import { APIButtonComponent, APISelectMenuComponent, ButtonStyle, ComponentType } from "discord-api-types/v10";

export class ButtonBuilder {
  private button: APIButtonComponent = {
    type: ComponentType.Button,
    style: ButtonStyle.Primary,
    label: '',
    custom_id: ''
  };

  setCustomId(customId: string): this {
    this.button.custom_id = customId;
    return this;
  }

  setLabel(label: string): this {
    this.button.label = label;
    return this;
  }

  setStyle(style: ButtonStyle): this {
    this.button.style = style;
    return this;
  }

  setEmoji(emoji: string): this {
    this.button.emoji = { name: emoji };
    return this;
  }

  setDisabled(disabled: boolean = true): this {
    this.button.disabled = disabled;
    return this;
  }

  setUrl(url: string): this {
    this.button.style = ButtonStyle.Link;
    this.button.url = url;
    delete this.button.custom_id;
    return this;
  }

  build(): APIButtonComponent {
    return this.button;
  }

  // Utility methods for common button types
  static primary(label: string, customId: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setLabel(label)
      .setCustomId(customId);
  }

  static secondary(label: string, customId: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setLabel(label)
      .setCustomId(customId);
  }

  static success(label: string, customId: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Success)
      .setLabel(label)
      .setCustomId(customId);
  }

  static danger(label: string, customId: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Danger)
      .setLabel(label)
      .setCustomId(customId);
  }

  static link(label: string, url: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel(label)
      .setUrl(url);
  }
}

export class SelectMenuBuilder {
  private selectMenu: APISelectMenuComponent = {
    type: ComponentType.StringSelect,
    custom_id: '',
    options: [],
    placeholder: 'Select an option...'
  };

  setCustomId(customId: string): this {
    this.selectMenu.custom_id = customId;
    return this;
  }

  setPlaceholder(placeholder: string): this {
    this.selectMenu.placeholder = placeholder;
    return this;
  }

  setMinValues(minValues: number): this {
    this.selectMenu.min_values = minValues;
    return this;
  }

  setMaxValues(maxValues: number): this {
    this.selectMenu.max_values = maxValues;
    return this;
  }

  addOption(label: string, value: string, description?: string, emoji?: string, isDefault?: boolean): this {
    const option: any = { label, value };
    if (description) option.description = description;
    if (emoji) option.emoji = { name: emoji };
    if (isDefault) option.default = true;
    
    this.selectMenu.options.push(option);
    return this;
  }

  addOptions(options: Array<{ label: string, value: string, description?: string, emoji?: string, isDefault?: boolean }>): this {
    options.forEach(option => this.addOption(option.label, option.value, option.description, option.emoji, option.isDefault));
    return this;
  }

  build(): APISelectMenuComponent {
    return this.selectMenu;
  }
}

export class ActionRowBuilder {
  private components: (APIButtonComponent | APISelectMenuComponent)[] = [];

  addComponents(...components: (APIButtonComponent | APISelectMenuComponent)[]): this {
    this.components.push(...components);
    return this;
  }

  build() {
    return {
      type: ComponentType.ActionRow,
      components: this.components
    };
  }
}