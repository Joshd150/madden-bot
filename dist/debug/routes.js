"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = __importDefault(require("@koa/router"));
const view_1 = require("../db/view");
const madden_hash_storage_1 = require("../db/madden_hash_storage");
const router = new router_1.default({ prefix: "/debug" });
router.get("/cacheStats", async (ctx) => {
    const stats = { madden: (0, madden_hash_storage_1.getMaddenCacheStats)(), view: (0, view_1.getViewCacheStats)() };
    ctx.status = 200;
    ctx.set("Content-Type", "application/json");
    ctx.body = {
        stats: stats
    };
});
exports.default = router;
//# sourceMappingURL=routes.js.map