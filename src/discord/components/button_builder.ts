import {
  APIButtonComponentWithCustomId,
  APIButtonComponentWithURL,
  APIStringSelectComponent,
  ButtonStyle,
  ComponentType,
  APIActionRowComponent,
} from "discord-api-types/v10";

// Properly typed button builder (CustomId or URL only)
type AnyButton = APIButtonComponentWithCustomId | APIButtonComponentWithURL;

export class ButtonBuilder {
  private button: Partial<AnyButton> = {
    type: ComponentType.Button,
    style: ButtonStyle.Primary,
    label: '',
    custom_id: '',
  };

  setCustomId(customId: string): this {
    // For non-link buttons
    (this.button as APIButtonComponentWithCustomId).custom_id = customId;
    delete (this.button as Partial<APIButtonComponentWithURL>).url;
    return this;
  }

  setLabel(label: string): this {
    this.button.label = label;
    return this;
  }

  setStyle(style: ButtonStyle): this {
    this.button.style = style as any;
    return this;
  }

  setEmoji(emoji: string): this {
    // Accept emoji name or full unicode; adjust as needed for custom emojis
    (this.button as any).emoji = { name: emoji };
    return this;
  }

  setDisabled(disabled: boolean = true): this {
    this.button.disabled = disabled;
    return this;
  }

  setUrl(url: string): this {
    // For Link buttons
    this.button.style = ButtonStyle.Link;
    (this.button as APIButtonComponentWithURL).url = url;
    delete (this.button as Partial<APIButtonComponentWithCustomId>).custom_id;
    return this;
  }

  build(): AnyButton {
    // Type assertion: either custom_id or url MUST exist
    if (this.button.style === ButtonStyle.Link) {
      return this.button as APIButtonComponentWithURL;
    } else {
      return this.button as APIButtonComponentWithCustomId;
    }
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
  private selectMenu: APIStringSelectComponent = {
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
    const option: APIStringSelectComponent['options'][0] = { label, value };
    if (description) option.description = description;
    if (emoji) option.emoji = { name: emoji };
    if (isDefault) option.default = true;

    this.selectMenu.options.push(option);
    return this;
  }

  addOptions(options: Array<{ label: string, value: string, description?: string, emoji?: string, isDefault?: boolean }>): this {
    options.forEach(option =>
      this.addOption(option.label, option.value, option.description, option.emoji, option.isDefault)
    );
    return this;
  }

  build(): APIStringSelectComponent {
    return this.selectMenu;
  }
}

export class ActionRowBuilder {
  private components: (AnyButton | APIStringSelectComponent)[] = [];

  addComponents(...components: (AnyButton | APIStringSelectComponent)[]): this {
    this.components.push(...components);
    return this;
  }

  build(): APIActionRowComponent<AnyButton | APIStringSelectComponent> {
    return {
      type: ComponentType.ActionRow,
      components: this.components
    };
  }
}
