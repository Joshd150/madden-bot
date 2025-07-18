import { APIEmbed, APIEmbedField } from "discord-api-types/v10";
export declare enum EmbedColor {
    PRIMARY = 2067276,// Green
    SUCCESS = 5763719,// Light Green
    WARNING = 16705372,// Yellow
    ERROR = 15548997,// Red
    INFO = 5793266,// Blurple
    SECONDARY = 10070709,// Gray
    MADDEN = 16739125,// Madden Orange
    TEAM_PRIMARY = 78697
}
export declare class EmbedBuilder {
    private embed;
    constructor();
    setTitle(title: string): this;
    setDescription(description: string): this;
    setColor(color: EmbedColor | number): this;
    setThumbnail(url: string): this;
    setImage(url: string): this;
    setAuthor(name: string, iconUrl?: string, url?: string): this;
    setFooter(text: string, iconUrl?: string): this;
    addField(name: string, value: string, inline?: boolean): this;
    addFields(fields: APIEmbedField[]): this;
    setTimestamp(timestamp?: Date): this;
    build(): APIEmbed;
    static success(title: string, description?: string): EmbedBuilder;
    static error(title: string, description?: string): EmbedBuilder;
    static warning(title: string, description?: string): EmbedBuilder;
    static info(title: string, description?: string): EmbedBuilder;
    static madden(title: string, description?: string): EmbedBuilder;
}
export declare function formatPlayerName(firstName: string, lastName: string, position: string): string;
export declare function formatTeamName(cityName: string, teamName: string): string;
export declare function formatRecord(wins: number, losses: number, ties?: number): string;
export declare function formatCurrency(amount: number): string;
export declare function formatPercentage(value: number, decimals?: number): string;
export declare function createProgressBar(current: number, max: number, length?: number): string;
//# sourceMappingURL=embed_builder.d.ts.map