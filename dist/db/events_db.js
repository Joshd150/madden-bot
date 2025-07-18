"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifiers = exports.EventDelivery = void 0;
const crypto_1 = require("crypto");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = __importDefault(require("./firebase"));
var EventDelivery;
(function (EventDelivery) {
    EventDelivery["EVENT_SOURCE"] = "EVENT_SOURCE";
    EventDelivery["EVENT_TRIGGER"] = "EVENT_TRIGGER";
})(EventDelivery || (exports.EventDelivery = EventDelivery = {}));
function convertDate(firebaseObject) {
    if (!firebaseObject)
        return null;
    for (const [key, value] of Object.entries(firebaseObject)) {
        // covert items inside array
        if (value && Array.isArray(value))
            firebaseObject[key] = value.map(item => convertDate(item));
        // convert inner objects
        if (value && typeof value === 'object') {
            firebaseObject[key] = convertDate(value);
        }
        // convert simple properties
        if (value && value.hasOwnProperty('_seconds'))
            firebaseObject[key] = value.toDate();
    }
    return firebaseObject;
}
exports.notifiers = {};
const EventDB = {
    async appendEvents(events, delivery) {
        if (delivery === EventDelivery.EVENT_SOURCE) {
            const batch = firebase_1.default.batch();
            const timestamp = new Date();
            events.forEach(event => {
                const eventId = (0, crypto_1.randomUUID)();
                const doc = firebase_1.default.collection("events").doc(event.key).collection(event.event_type).doc(eventId);
                batch.set(doc, { ...event, timestamp: timestamp, id: eventId });
            });
            await batch.commit();
        }
        Object.entries(Object.groupBy(events, e => e.event_type)).map(async (entry) => {
            const [eventType, specificTypeEvents] = entry;
            if (specificTypeEvents) {
                const eventTypeNotifiers = exports.notifiers[eventType];
                if (eventTypeNotifiers) {
                    await Promise.all(eventTypeNotifiers.map(async (notifier) => {
                        try {
                            await notifier(specificTypeEvents);
                        }
                        catch (e) {
                            console.log("could not send events to notifier " + e);
                        }
                    }));
                }
            }
        });
    },
    async queryEvents(key, event_type, after, filters, limit) {
        const events = await firebase_1.default.collection("events").doc(key).collection(event_type).where(firestore_1.Filter.and(...[firestore_1.Filter.where("timestamp", ">", after), ...Object.entries(filters).map(e => {
                const [property, value] = e;
                return firestore_1.Filter.where(property, "==", value);
            })])).orderBy("timestamp", "desc").limit(limit).get();
        return events.docs.map(doc => convertDate(doc.data()));
    },
    on(event_type, notifier) {
        const currentNotifiers = exports.notifiers[event_type] || [];
        exports.notifiers[event_type] = [notifier].concat(currentNotifiers);
    }
};
exports.default = EventDB;
//# sourceMappingURL=events_db.js.map