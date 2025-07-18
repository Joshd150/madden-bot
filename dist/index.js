"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
const trades_monitor_1 = require("./vfl/automation/trades_monitor");
const scores_monitor_1 = require("./vfl/automation/scores_monitor");
const port = process.env.PORT || 3002;
server_1.default.listen(port, () => {
    console.log(`server started on ${port}`);
    // Start VFL automation systems
    console.log('🚀 Starting VFL Manager automation systems...');
    (0, trades_monitor_1.startTradesMonitor)();
    (0, scores_monitor_1.startScoresMonitor)();
    console.log('✅ VFL Manager automation systems started!');
});
//# sourceMappingURL=index.js.map