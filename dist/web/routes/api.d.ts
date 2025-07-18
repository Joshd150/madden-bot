/// <reference types="koa" />
/// <reference types="koa__router" />
import Router from "@koa/router";
/**
 * VFL Manager API Routes - The data highway for our web interface!
 *
 * These API endpoints serve data from our Firestore database to the web interface.
 * They use the exact same database and data structures as our Discord bot, ensuring
 * perfect consistency between the bot and website.
 *
 * Think of these as the bridge between our beautiful web interface and the rich
 * data that our Discord bot manages. Every endpoint is designed to be fast,
 * reliable, and provide exactly the data our frontend needs.
 */
declare const router: Router<import("koa").DefaultState, import("koa").DefaultContext>;
export default router;
//# sourceMappingURL=api.d.ts.map