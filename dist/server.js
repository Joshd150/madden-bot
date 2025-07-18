"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const bodyparser_1 = __importDefault(require("@koa/bodyparser"));
const koa_static_1 = __importDefault(require("koa-static"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./export/routes"));
const routes_2 = __importDefault(require("./discord/routes"));
const routes_3 = __importDefault(require("./twitch-notifier/routes"));
const routes_4 = __importDefault(require("./connections/routes"));
const routes_5 = __importDefault(require("./debug/routes"));
const routes_6 = __importDefault(require("./dashboard/routes"));
const api_1 = __importDefault(require("./web/routes/api"));
const admin_1 = __importDefault(require("./web/routes/admin"));
const api_2 = __importDefault(require("./web/routes/api"));
const admin_2 = __importDefault(require("./web/routes/admin"));
const app = new koa_1.default();
app
    .use((0, koa_static_1.default)(path_1.default.join(__dirname, 'public')))
    .use((0, koa_static_1.default)(path_1.default.join(__dirname, 'web/public')))
    .use((0, bodyparser_1.default)({ enableTypes: ["json", "form"], encoding: "utf-8", jsonLimit: "100mb" }))
    .use(async (ctx, next) => {
    try {
        await next();
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = {
            message: err.message
        };
    }
})
    .use(routes_1.default.routes())
    .use(routes_1.default.allowedMethods())
    .use(routes_2.default.routes())
    .use(routes_2.default.allowedMethods())
    .use(routes_3.default.routes())
    .use(routes_3.default.allowedMethods())
    .use(routes_4.default.routes())
    .use(routes_4.default.allowedMethods())
    .use(routes_5.default.routes())
    .use(routes_5.default.allowedMethods())
    .use(routes_6.default.routes())
    .use(routes_6.default.allowedMethods())
    .use(api_1.default.routes())
    .use(api_1.default.allowedMethods())
    .use(admin_1.default.routes())
    .use(admin_1.default.allowedMethods())
    .use(api_2.default.routes())
    .use(api_2.default.allowedMethods())
    .use(admin_2.default.routes())
    .use(admin_2.default.allowedMethods());
exports.default = app;
//# sourceMappingURL=server.js.map