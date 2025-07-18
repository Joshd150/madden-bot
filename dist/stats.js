"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = __importDefault(require("./db/firebase"));
async function count() {
    const docs = await firebase_1.default.collection("league_data").listDocuments();
    console.log(docs.length);
}
count();
//# sourceMappingURL=stats.js.map