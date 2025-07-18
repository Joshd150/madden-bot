import { CommandHandler, AutocompleteHandler, MessageComponentHandler } from "../commands_handler";
export type StatItem = {
    value: number;
    name: string;
};
export type RatioItem = {
    top: number;
    bottom: number;
};
export type SeasonAggregation = {
    [seasonIndex: number]: {
        passYds?: StatItem;
        passTDs?: StatItem;
        passInts?: StatItem;
        passPercent?: RatioItem;
        passSacks?: StatItem;
        rushYds?: StatItem;
        rushTDs?: StatItem;
        rushAtt?: StatItem;
        rushFum?: StatItem;
        recYds?: StatItem;
        recTDs?: StatItem;
        recCatches?: StatItem;
        recDrops?: StatItem;
        defTotalTackles?: StatItem;
        defSacks?: StatItem;
        defInts?: StatItem;
        defFumRec?: StatItem;
        defForcedFum?: StatItem;
        defTDs?: StatItem;
        fGMade?: StatItem;
        fGAtt?: StatItem;
        xPMade?: StatItem;
        xPAtt?: StatItem;
        kickPts?: StatItem;
        puntYds?: StatItem;
        puntAtt?: StatItem;
        puntsIn20?: StatItem;
        puntNetYds?: StatItem;
        puntsBlocked?: StatItem;
        puntTBs?: StatItem;
    };
};
declare const _default: CommandHandler & AutocompleteHandler & MessageComponentHandler;
export default _default;
//# sourceMappingURL=player.d.ts.map