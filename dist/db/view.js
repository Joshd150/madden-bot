"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerSearchIndex = exports.discordLeagueView = exports.teamSearchView = exports.getViewCacheStats = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const events_db_1 = __importDefault(require("./events_db"));
const madden_db_1 = __importDefault(require("./madden_db"));
const firebase_1 = __importDefault(require("./firebase"));
const TTL = 0;
class View {
    id;
    constructor(id) {
        this.id = id;
    }
}
const viewCache = new node_cache_1.default();
function getViewCacheStats() {
    return viewCache.getStats();
}
exports.getViewCacheStats = getViewCacheStats;
class CachedUpdatingView extends View {
    view;
    constructor(view) {
        super(view.id);
        this.view = view;
    }
    createCacheKey(key) {
        return key + "|" + this.id;
    }
    async createView(key) {
        const cachedView = viewCache.get(this.createCacheKey(key));
        if (cachedView) {
            return cachedView;
        }
        const view = await this.view.createView(key);
        viewCache.set(this.createCacheKey(key), view, TTL);
        return view;
    }
    listen(...event_types) {
        event_types.forEach(event_type => {
            events_db_1.default.on(event_type, async (events) => {
                const key = events.map(e => e.key)[0];
                const currentView = await this.createView(key);
                if (currentView) {
                    const newView = this.update({ [event_type]: events }, currentView);
                    viewCache.set(this.createCacheKey(key), newView, TTL);
                }
            });
        });
    }
}
class TeamSearchIndex extends View {
    constructor() {
        super("team_search_index");
    }
    async createView(key) {
        const teams = await madden_db_1.default.getLatestTeams(key);
        return Object.fromEntries(teams.getLatestTeams().map(t => { return [`${t.teamId}`, { cityName: t.cityName, abbrName: t.abbrName, nickName: t.nickName, displayName: t.displayName, id: t.teamId }]; }));
    }
}
class CacheableTeamSearchIndex extends CachedUpdatingView {
    constructor() {
        super(new TeamSearchIndex());
    }
    update(event, currentView) {
        if (event["MADDEN_TEAM"]) {
            const updatedTeams = event["MADDEN_TEAM"];
            updatedTeams.forEach(t => {
                currentView[t.teamId] = { cityName: t.cityName, abbrName: t.abbrName, nickName: t.nickName, displayName: t.displayName, id: t.teamId };
            });
        }
        return currentView;
    }
}
exports.teamSearchView = new CacheableTeamSearchIndex();
exports.teamSearchView.listen("MADDEN_TEAM");
class DiscordLeagueConnection extends View {
    constructor() {
        super("discord_league_connection");
    }
    async createView(key) {
        const doc = await firebase_1.default.collection("league_settings").doc(key).get();
        const leagueSettings = doc.exists ? doc.data() : {};
        const leagueId = leagueSettings?.commands?.madden_league?.league_id;
        if (leagueId) {
            return { guildId: key, leagueId: leagueId };
        }
    }
}
class CacheableDiscordLeagueConnection extends CachedUpdatingView {
    constructor() {
        super(new DiscordLeagueConnection());
    }
    update(event, currentView) {
        if (event["DISCORD_LEAGUE_CONNECTION"]) {
            const leagueEvents = event["DISCORD_LEAGUE_CONNECTION"];
            return leagueEvents[0];
        }
        return currentView;
    }
}
exports.discordLeagueView = new CacheableDiscordLeagueConnection();
exports.discordLeagueView.listen("DISCORD_LEAGUE_CONNECTION");
class PlayerSearchIndex extends View {
    constructor() {
        super("player_search_index");
    }
    async createView(key) {
        const players = await madden_db_1.default.getLatestPlayers(key);
        return Object.fromEntries(players.map(p => [p.rosterId + "", { rosterId: p.rosterId, firstName: p.firstName, lastName: p.lastName, teamId: p.teamId, position: p.position }]));
    }
}
class CacheablePlayerSearchIndex extends CachedUpdatingView {
    constructor() {
        super(new PlayerSearchIndex());
    }
    update(event, currentView) {
        if (event["MADDEN_PLAYER"]) {
            const playerUpdates = event["MADDEN_PLAYER"];
            playerUpdates.forEach(p => {
                currentView[p.rosterId] = { rosterId: p.rosterId, firstName: p.firstName, lastName: p.lastName, teamId: p.teamId, position: p.position };
            });
        }
        return currentView;
    }
}
exports.playerSearchIndex = new CacheablePlayerSearchIndex();
exports.playerSearchIndex.listen("MADDEN_PLAYER");
//# sourceMappingURL=view.js.map