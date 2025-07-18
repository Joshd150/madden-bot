type EventId = string;
export type SnallabotEvent<Event> = {
    key: string;
    event_type: string;
} & Event;
export type StoredEvent<Event> = SnallabotEvent<Event> & {
    timestamp: Date;
    id: EventId;
};
export type Filters = {
    [key: string]: any;
} | {};
export declare enum EventDelivery {
    EVENT_SOURCE = "EVENT_SOURCE",
    EVENT_TRIGGER = "EVENT_TRIGGER"
}
export type EventNotifier<Event> = (events: SnallabotEvent<Event>[]) => Promise<void>;
interface EventDB {
    appendEvents<Event>(event: SnallabotEvent<Event>[], delivery: EventDelivery): Promise<void>;
    queryEvents<Event>(key: string, event_type: string, after: Date, filters: Filters, limit: number): Promise<StoredEvent<Event>[]>;
    on<Event>(event_type: string, notifier: EventNotifier<Event>): void;
}
export declare const notifiers: {
    [key: string]: EventNotifier<any>[];
};
declare const EventDB: EventDB;
export default EventDB;
//# sourceMappingURL=events_db.d.ts.map