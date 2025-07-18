/// <reference types="koa" />
/// <reference types="koa__router" />
import Router from "@koa/router";
declare const router: Router<import("koa").DefaultState, import("koa").DefaultContext>;
export declare class EAAccountError extends Error {
    troubleshoot: string;
    constructor(message: string, troubleshoot: string);
}
export default router;
//# sourceMappingURL=routes.d.ts.map