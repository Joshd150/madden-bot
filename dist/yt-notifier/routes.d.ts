export declare function extractChannelId(html: string): string;
interface YoutubeNotifierHandler {
    addYoutubeChannel(discordServer: string, youtubeUrl: string): Promise<void>;
    removeYoutubeChannel(discordServer: string, youtubeUrl: string): Promise<void>;
    listYoutubeChannels(discordServer: string): Promise<string[]>;
}
export declare const youtubeNotifierHandler: YoutubeNotifierHandler;
export {};
//# sourceMappingURL=routes.d.ts.map