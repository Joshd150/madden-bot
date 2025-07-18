/// <reference types="koa" />
/// <reference types="koa__router" />
import Router from "@koa/router";
declare const router: Router<import("koa").DefaultState, import("koa").DefaultContext>;
interface TwitchNotifier {
    addTwitchChannel(discordServer: string, twitchUrl: string): Promise<void>;
    removeTwitchChannel(discordServer: string, twitchUrl: string): Promise<void>;
    listTwitchChannels(discordServer: string): Promise<string[]>;
}
export declare const twitchNotifierHandler: TwitchNotifier;
export default router;
//# sourceMappingURL=routes.d.ts.map