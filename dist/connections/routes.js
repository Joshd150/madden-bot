"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLeague = exports.setLeague = void 0;
const router_1 = __importDefault(require("@koa/router"));
const firebase_1 = __importDefault(require("../db/firebase"));
const events_db_1 = __importStar(require("../db/events_db"));
const firestore_1 = require("firebase-admin/firestore");
const router = new router_1.default({ prefix: "/connect" });
async function setLeague(guild, league) {
    await firebase_1.default.collection("league_settings").doc(guild).set({ commands: { madden_league: { league_id: league } } }, { merge: true });
    await events_db_1.default.appendEvents([{ key: guild, event_type: "DISCORD_LEAGUE_CONNECTION", guildId: guild, leagueId: league }], events_db_1.EventDelivery.EVENT_TRIGGER);
}
exports.setLeague = setLeague;
async function removeLeague(guild) {
    await firebase_1.default.collection("league_settings").doc(guild).update({ ["commands.madden_league"]: firestore_1.FieldValue.delete() });
    //TODO(snallapa) new event?
    await events_db_1.default.appendEvents([{ key: guild, event_type: "DISCORD_LEAGUE_CONNECTION", guildId: guild, leagueId: "" }], events_db_1.EventDelivery.EVENT_TRIGGER);
}
exports.removeLeague = removeLeague;
router.post("/discord/:guild/madden/:league", async (ctx) => {
    const { guild, league } = ctx.params;
    await setLeague(guild, league);
    ctx.status = 200;
}).all("/discord/:guild/:platform/:league/(.*)", async (ctx) => {
    const { guild, league } = ctx.params;
    await setLeague(guild, league);
    const redirectPath = ctx.path.replace(`/connect/discord/${guild}`, '');
    ctx.status = 308;
    ctx.redirect(redirectPath);
});
exports.default = router;
//# sourceMappingURL=routes.js.map