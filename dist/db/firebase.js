"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const node_fs_1 = require("node:fs");
function setupFirebase() {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        (0, app_1.initializeApp)({ projectId: "dev" });
    }
    // production, use firebase with SA credentials passed from environment or a file
    else if (process.env.SERVICE_ACCOUNT_FILE) {
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)(process.env.SERVICE_ACCOUNT_FILE, 'utf8'));
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount)
        });
    }
    else if (process.env.SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount)
        });
    }
    // dev, use firebase emulator
    else {
        throw new Error("Firestore emulator is not running!");
    }
    return (0, firestore_1.getFirestore)();
}
const db = setupFirebase();
exports.default = db;
//# sourceMappingURL=firebase.js.map