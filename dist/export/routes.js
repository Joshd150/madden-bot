"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = __importDefault(require("@koa/router"));
const exporter_1 = require("./exporter");
const ea_client_1 = require("../dashboard/ea_client");
const router = new router_1.default();
async function maddenExportErrorMiddleware(ctx, next) {
    if (ctx.request?.body?.success === undefined) {
        ctx.status = 400;
    }
    else {
        if (ctx.request.body.success) {
            await next();
        }
    }
}
function toStage(exportStage) {
    return exportStage === "reg" ? ea_client_1.Stage.SEASON : ea_client_1.Stage.PRESEASON;
}
router.post("/:platform/:l/leagueteams", maddenExportErrorMiddleware, async (ctx, next) => {
    const { platform, l } = ctx.params;
    const teamsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.leagueTeams(platform, l, teamsExport);
    ctx.status = 200;
}).post("/:platform/:l/standings", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l } = ctx.params;
    const standingsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.standings(platform, l, standingsExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/schedules", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const schedulesExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.schedules(platform, l, Number.parseInt(week), toStage(stage), schedulesExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/punting", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const puntingExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.punting(platform, l, Number.parseInt(week), toStage(stage), puntingExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/teamstats", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const teamStatsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.teamStats(platform, l, Number.parseInt(week), toStage(stage), teamStatsExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/passing", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const passingStatsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.passing(platform, l, Number.parseInt(week), toStage(stage), passingStatsExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/kicking", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const kickingStatsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.kicking(platform, l, Number.parseInt(week), toStage(stage), kickingStatsExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/rushing", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const rushingStatsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.rushing(platform, l, Number.parseInt(week), toStage(stage), rushingStatsExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/defense", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const defensiveStatsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.defense(platform, l, Number.parseInt(week), toStage(stage), defensiveStatsExport);
    ctx.status = 200;
}).post("/:platform/:l/week/:stage/:week/receiving", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, week, stage } = ctx.params;
    const receivingStatsExport = ctx.request.body;
    await exporter_1.SnallabotExportDestination.receiving(platform, l, Number.parseInt(week), toStage(stage), receivingStatsExport);
    ctx.status = 200;
}).post("/:platform/:l/freeagents/roster", async (ctx) => {
    const { platform, l } = ctx.params;
    const roster = ctx.request.body;
    await exporter_1.SnallabotExportDestination.freeagents(platform, l, roster);
    ctx.status = 200;
}).post("/:platform/:l/team/:team/roster", maddenExportErrorMiddleware, async (ctx) => {
    const { platform, l, team } = ctx.params;
    const roster = ctx.request.body;
    await exporter_1.SnallabotExportDestination.teamRoster(platform, l, team, roster);
    ctx.status = 200;
});
exports.default = router;
//# sourceMappingURL=routes.js.map