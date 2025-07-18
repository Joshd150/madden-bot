import NodeCache from "node-cache";
import { DiscordLeagueConnectionEvent } from "./events";
declare abstract class View<T> {
    id: string;
    constructor(id: string);
    abstract createView(key: string): Promise<T | undefined>;
}
export declare function getViewCacheStats(): NodeCache.Stats;
declare abstract class CachedUpdatingView<T> extends View<T> {
    view: View<T>;
    constructor(view: View<T>);
    createCacheKey(key: string): string;
    createView(key: string): Promise<T>;
    abstract update(event: {
        [key: string]: any[];
    }, currentView: T): T;
    listen(...event_types: string[]): void;
}
type TeamSearch = {
    [key: string]: {
        cityName: string;
        abbrName: string;
        nickName: string;
        displayName: string;
        id: number;
    };
};
declare class CacheableTeamSearchIndex extends CachedUpdatingView<TeamSearch> {
    constructor();
    update(event: {
        [key: string]: any[];
    }, currentView: TeamSearch): TeamSearch;
}
export declare const teamSearchView: CacheableTeamSearchIndex;
declare class CacheableDiscordLeagueConnection extends CachedUpdatingView<DiscordLeagueConnectionEvent> {
    constructor();
    update(event: {
        [key: string]: any[];
    }, currentView: DiscordLeagueConnectionEvent): DiscordLeagueConnectionEvent;
}
export declare const discordLeagueView: CacheableDiscordLeagueConnection;
type PlayerSearch = {
    [key: string]: {
        rosterId: number;
        firstName: string;
        lastName: string;
        teamId: number;
        position: string;
    };
};
declare class CacheablePlayerSearchIndex extends CachedUpdatingView<PlayerSearch> {
    constructor();
    update(event: {
        [key: string]: any[];
    }, currentView: PlayerSearch): PlayerSearch;
}
export declare const playerSearchIndex: CacheablePlayerSearchIndex;
export {};
//# sourceMappingURL=view.d.ts.map