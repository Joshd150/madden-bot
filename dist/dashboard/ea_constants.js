"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seasonType = exports.exportOptions = exports.Stage = exports.BLAZE_PRODUCT_NAME = exports.BLAZE_SERVICE_TO_PATH = exports.BLAZE_SERVICE = exports.NAMESPACES = exports.SYSTEM_MAP = exports.ENTITLEMENT_TO_VALID_NAMESPACE = exports.ENTITLEMENT_TO_SYSTEM = exports.SystemConsole = exports.VALID_ENTITLEMENTS = exports.YEAR = exports.TWO_DIGIT_YEAR = exports.EA_LOGIN_URL = exports.MACHINE_KEY = exports.CLIENT_ID = exports.REDIRECT_URL = exports.CLIENT_SECRET = exports.AUTH_SOURCE = void 0;
exports.AUTH_SOURCE = 317239;
exports.CLIENT_SECRET = "wfGAWnrxLroZOwwELYA2ZrAuaycuF2WDb00zOLv48Sb79viJDGlyD6OyK8pM5eIiv_20240731135155";
exports.REDIRECT_URL = "http://127.0.0.1/success";
exports.CLIENT_ID = "MCA_25_COMP_APP";
exports.MACHINE_KEY = "444d362e8e067fe2";
exports.EA_LOGIN_URL = `https://accounts.ea.com/connect/auth?hide_create=true&release_type=prod&response_type=code&redirect_uri=${exports.REDIRECT_URL}&client_id=${exports.CLIENT_ID}&machineProfileKey=${exports.MACHINE_KEY}&authentication_source=${exports.AUTH_SOURCE}`;
exports.TWO_DIGIT_YEAR = "25";
exports.YEAR = "2025";
exports.VALID_ENTITLEMENTS = ((a) => ({
    xone: `MADDEN_${a}XONE`,
    ps4: `MADDEN_${a}PS4`,
    pc: `MADDEN_${a}PC`,
    ps5: `MADDEN_${a}PS5`,
    xbsx: `MADDEN_${a}XBSX`,
    stadia: `MADDEN_${a}SDA`,
}))(exports.TWO_DIGIT_YEAR);
var SystemConsole;
(function (SystemConsole) {
    SystemConsole["XBOX_ONE"] = "xone";
    SystemConsole["PS4"] = "ps4";
    SystemConsole["PC"] = "pc";
    SystemConsole["PS5"] = "ps5";
    SystemConsole["XBOX_X"] = "xbsx";
    SystemConsole["STADIA"] = "stadia";
})(SystemConsole || (exports.SystemConsole = SystemConsole = {}));
exports.ENTITLEMENT_TO_SYSTEM = ((a) => ({
    [`MADDEN_${a}XONE`]: SystemConsole.XBOX_ONE,
    [`MADDEN_${a}PS4`]: SystemConsole.PS4,
    [`MADDEN_${a}PC`]: SystemConsole.PC,
    [`MADDEN_${a}PS5`]: SystemConsole.PS5,
    [`MADDEN_${a}XBSX`]: SystemConsole.XBOX_X,
    [`MADDEN_${a}SDA`]: SystemConsole.STADIA,
}))(exports.TWO_DIGIT_YEAR);
exports.ENTITLEMENT_TO_VALID_NAMESPACE = ((a) => ({
    [`MADDEN_${a}XONE`]: "xbox",
    [`MADDEN_${a}PS4`]: "ps3",
    [`MADDEN_${a}PC`]: "cem_ea_id",
    [`MADDEN_${a}PS5`]: "ps3",
    [`MADDEN_${a}XBSX`]: "xbox",
    [`MADDEN_${a}SDA`]: "stadia",
}))(exports.TWO_DIGIT_YEAR);
const SYSTEM_MAP = (a) => ({
    xone: `MADDEN_${a}_XONE_BLZ_SERVER`,
    ps4: `MADDEN_${a}_PS4_BLZ_SERVER`,
    pc: `MADDEN_${a}_PC_BLZ_SERVER`,
    ps5: `MADDEN_${a}_PS5_BLZ_SERVER`,
    xbsx: `MADDEN_${a}_XBSX_BLZ_SERVER`,
    stadia: `MADDEN_${a}_SDA_BLZ_SERVER`,
});
exports.SYSTEM_MAP = SYSTEM_MAP;
exports.NAMESPACES = {
    xbox: "XBOX",
    ps3: "PSN",
    cem_ea_id: "EA Account",
    stadia: "Stadia",
};
exports.BLAZE_SERVICE = ((a) => ({
    xone: `madden-${a}-xone-gen4`,
    ps4: `madden-${a}-ps4-gen4`,
    pc: `madden-${a}-pc-gen5`,
    ps5: `madden-${a}-ps5-gen5`,
    xbsx: `madden-${a}-xbsx-gen5`,
    stadia: `madden-${a}-stadia-gen5`,
}))(exports.YEAR);
exports.BLAZE_SERVICE_TO_PATH = ((a) => ({
    [`madden-${a}-xone-gen4`]: "xone",
    [`madden-${a}-ps4-gen4`]: "ps4",
    [`madden-${a}-pc-gen5`]: "pc",
    [`madden-${a}-ps5-gen5`]: "ps5",
    [`madden-${a}-xbsx-gen5`]: "xbsx",
    [`madden-${a}-stadia-gen5`]: "stadia",
}))(exports.YEAR);
exports.BLAZE_PRODUCT_NAME = ((a) => ({
    xone: `madden-${a}-xone-mca`,
    ps4: `madden-${a}-ps4-mca`,
    pc: `madden-${a}-pc-mca`,
    ps5: `madden-${a}-ps5-mca`,
    xbsx: `madden-${a}-xbsx-mca`,
    stadia: `madden-${a}-stadia-mca`,
}))(exports.YEAR);
var Stage;
(function (Stage) {
    Stage[Stage["UNKNOWN"] = -1] = "UNKNOWN";
    Stage[Stage["PRESEASON"] = 0] = "PRESEASON";
    Stage[Stage["SEASON"] = 1] = "SEASON";
})(Stage || (exports.Stage = Stage = {}));
exports.exportOptions = {
    "Current Week": {
        stage: Stage.UNKNOWN,
        week: 100,
    },
    "Preseason Week 1": {
        stage: Stage.PRESEASON,
        week: 1,
    },
    "Preseason Week 2": {
        stage: Stage.PRESEASON,
        week: 2,
    },
    "Preseason Week 3": {
        stage: Stage.PRESEASON,
        week: 3,
    },
    "Preseason Week 4": {
        stage: Stage.PRESEASON,
        week: 4,
    },
    "Regular Season Week 1": {
        stage: Stage.SEASON,
        week: 1,
    },
    "Regular Season Week 2": {
        stage: Stage.SEASON,
        week: 2,
    },
    "Regular Season Week 3": {
        stage: Stage.SEASON,
        week: 3,
    },
    "Regular Season Week 4": {
        stage: Stage.SEASON,
        week: 4,
    },
    "Regular Season Week 5": {
        stage: Stage.SEASON,
        week: 5,
    },
    "Regular Season Week 6": {
        stage: Stage.SEASON,
        week: 6,
    },
    "Regular Season Week 7": {
        stage: Stage.SEASON,
        week: 7,
    },
    "Regular Season Week 8": {
        stage: Stage.SEASON,
        week: 8,
    },
    "Regular Season Week 9": {
        stage: Stage.SEASON,
        week: 9,
    },
    "Regular Season Week 10": {
        stage: Stage.SEASON,
        week: 10,
    },
    "Regular Season Week 11": {
        stage: Stage.SEASON,
        week: 11,
    },
    "Regular Season Week 12": {
        stage: Stage.SEASON,
        week: 12,
    },
    "Regular Season Week 13": {
        stage: Stage.SEASON,
        week: 13,
    },
    "Regular Season Week 14": {
        stage: Stage.SEASON,
        week: 14,
    },
    "Regular Season Week 15": {
        stage: Stage.SEASON,
        week: 15,
    },
    "Regular Season Week 16": {
        stage: Stage.SEASON,
        week: 16,
    },
    "Regular Season Week 17": {
        stage: Stage.SEASON,
        week: 17,
    },
    "Regular Season Week 18": {
        stage: Stage.SEASON,
        week: 18,
    },
    "Wildcard Round": {
        stage: Stage.SEASON,
        week: 19,
    },
    "Divisional Round": {
        stage: Stage.SEASON,
        week: 20,
    },
    "Conference Championship Round": {
        stage: Stage.SEASON,
        week: 21,
    },
    Superbowl: {
        stage: Stage.SEASON,
        week: 23,
    },
    "All Weeks": {
        stage: Stage.UNKNOWN,
        week: 101,
    },
};
function seasonType(seasonInfo) {
    switch (seasonInfo.seasonWeekType) {
        case 0:
            return "Preseason";
        case 1:
            return "Regular Season";
        case 2:
        case 3:
        case 5:
        case 6:
            return "Post Season";
        case 8:
            return "Off Season";
        default:
            return "something else";
    }
}
exports.seasonType = seasonType;
//# sourceMappingURL=ea_constants.js.map