import { APIButtonComponent, APISelectMenuComponent, ButtonStyle, ComponentType } from "discord-api-types/v10";
export declare class ButtonBuilder {
    private button;
    setCustomId(customId: string): this;
    setLabel(label: string): this;
    setStyle(style: ButtonStyle): this;
    setEmoji(emoji: string): this;
    setDisabled(disabled?: boolean): this;
    setUrl(url: string): this;
    build(): APIButtonComponent;
    static primary(label: string, customId: string): ButtonBuilder;
    static secondary(label: string, customId: string): ButtonBuilder;
    static success(label: string, customId: string): ButtonBuilder;
    static danger(label: string, customId: string): ButtonBuilder;
    static link(label: string, url: string): ButtonBuilder;
}
export declare class SelectMenuBuilder {
    private selectMenu;
    setCustomId(customId: string): this;
    setPlaceholder(placeholder: string): this;
    setMinValues(minValues: number): this;
    setMaxValues(maxValues: number): this;
    addOption(label: string, value: string, description?: string, emoji?: string, isDefault?: boolean): this;
    addOptions(options: Array<{
        label: string;
        value: string;
        description?: string;
        emoji?: string;
        isDefault?: boolean;
    }>): this;
    build(): APISelectMenuComponent;
}
export declare class ActionRowBuilder {
    private components;
    addComponents(...components: (APIButtonComponent | APISelectMenuComponent)[]): this;
    build(): {
        type: ComponentType;
        components: (APIButtonComponent | APISelectMenuComponent)[];
    };
}
//# sourceMappingURL=button_builder.d.ts.map