type UserInfo = {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    email: string;
    created_at: string;
};
type TwitchUserInformation = {
    data: Array<UserInfo>;
};
type BroadcasterInfo = {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    broadcaster_language: string;
    game_id: string;
    game_name: string;
    title: string;
    delay: number;
    tags: Array<string>;
    content_classification_labels: Array<string>;
    is_branded_content: boolean;
};
type TwitchChannelInformation = {
    data: Array<BroadcasterInfo>;
};
type SubscriptionResponse = {
    data: Array<{
        id: string;
        status: string;
        type: string;
        version: string;
        cost: number;
        condition: {
            broadcaster_user_id: string;
        };
        transport: {
            method: string;
            callback: string;
        };
        created_at: string;
    }>;
    total: number;
    total_cost: number;
    max_total_cost: number;
};
interface TwitchClient {
    retrieveBroadcasterInformation(twitchUrl: string): Promise<TwitchUserInformation>;
    retrieveChannelInformation(broadcasterUserId: string): Promise<TwitchChannelInformation>;
    subscribeBroadcasterStreamOnline(broadcasterUserId: string): Promise<SubscriptionResponse>;
    deleteSubscription(subscriptionId: string): Promise<void>;
}
export declare function getSecret(): string;
declare const TwitchClient: () => TwitchClient;
export declare function createTwitchClient(): TwitchClient;
export {};
//# sourceMappingURL=twitch_client.d.ts.map