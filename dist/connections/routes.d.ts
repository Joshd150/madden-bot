/// <reference types="koa" />
/// <reference types="koa__router" />
import Router from "@koa/router";
declare const router: Router<import("koa").DefaultState, import("koa").DefaultContext>;
export declare function setLeague(guild: string, league: string): Promise<void>;
export declare function removeLeague(guild: string): Promise<void>;
export default router;
//# sourceMappingURL=routes.d.ts.map