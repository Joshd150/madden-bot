"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPositions = exports.dLinePositions = exports.oLinePositions = exports.POSITION_GROUP = exports.POSITIONS = exports.LBStyleTrait = exports.QBStyleTrait = exports.PenaltyTrait = exports.PlayBallTrait = exports.CoverBallTrait = exports.SensePressureTrait = exports.DevTrait = exports.YesNoTrait = exports.GameResult = exports.formatRecord = exports.getMessageForWeek = exports.MADDEN_SEASON = void 0;
exports.MADDEN_SEASON = 2024;
function getMessageForWeek(week) {
    if (week < 1 || week > 23 || week === 22) {
        throw new Error("Invalid week number. Valid weeks are week 1-18 and for playoffs: Wildcard = 19, Divisional = 20, Conference Championship = 21, Super Bowl = 23");
    }
    if (week <= 18) {
        return `Week ${week}`;
    }
    else if (week === 19) {
        return "Wildcard Round";
    }
    else if (week === 20) {
        return "Divisional Round";
    }
    else if (week === 21) {
        return "Conference Championship Round";
    }
    else if (week === 23) {
        return "Super Bowl";
    }
    throw new Error("Unknown week " + week);
}
exports.getMessageForWeek = getMessageForWeek;
function formatRecord(standing) {
    if (standing.totalTies === 0) {
        return `${standing.totalWins}-${standing.totalLosses}`;
    }
    return `${standing.totalWins}-${standing.totalLosses}-${standing.totalTies}`;
}
exports.formatRecord = formatRecord;
var GameResult;
(function (GameResult) {
    GameResult[GameResult["NOT_PLAYED"] = 1] = "NOT_PLAYED";
    GameResult[GameResult["AWAY_WIN"] = 2] = "AWAY_WIN";
    GameResult[GameResult["HOME_WIN"] = 3] = "HOME_WIN";
    GameResult[GameResult["TIE"] = 4] = "TIE"; // unconfirmed
})(GameResult || (exports.GameResult = GameResult = {}));
var YesNoTrait;
(function (YesNoTrait) {
    YesNoTrait[YesNoTrait["NO"] = 0] = "NO";
    YesNoTrait[YesNoTrait["YES"] = 1] = "YES";
})(YesNoTrait || (exports.YesNoTrait = YesNoTrait = {}));
var DevTrait;
(function (DevTrait) {
    DevTrait[DevTrait["NORMAL"] = 0] = "NORMAL";
    DevTrait[DevTrait["STAR"] = 1] = "STAR";
    DevTrait[DevTrait["SUPERSTAR"] = 2] = "SUPERSTAR";
    DevTrait[DevTrait["XFACTOR"] = 3] = "XFACTOR";
})(DevTrait || (exports.DevTrait = DevTrait = {}));
var SensePressureTrait;
(function (SensePressureTrait) {
    SensePressureTrait[SensePressureTrait["PARANOID"] = 0] = "PARANOID";
    SensePressureTrait[SensePressureTrait["TRIGGER_HAPPY"] = 1] = "TRIGGER_HAPPY";
    SensePressureTrait[SensePressureTrait["IDEAL"] = 2] = "IDEAL";
    SensePressureTrait[SensePressureTrait["AVERAGE"] = 3] = "AVERAGE";
    SensePressureTrait[SensePressureTrait["OBLIVIOUS"] = 4] = "OBLIVIOUS";
})(SensePressureTrait || (exports.SensePressureTrait = SensePressureTrait = {}));
var CoverBallTrait;
(function (CoverBallTrait) {
    CoverBallTrait[CoverBallTrait["NEVER"] = 1] = "NEVER";
    CoverBallTrait[CoverBallTrait["ON_BIG_HITS"] = 2] = "ON_BIG_HITS";
    CoverBallTrait[CoverBallTrait["ON_MEDIUM_HITS"] = 3] = "ON_MEDIUM_HITS";
    CoverBallTrait[CoverBallTrait["FOR_ALL_HITS"] = 4] = "FOR_ALL_HITS";
    CoverBallTrait[CoverBallTrait["ALWAYS"] = 5] = "ALWAYS";
})(CoverBallTrait || (exports.CoverBallTrait = CoverBallTrait = {}));
var PlayBallTrait;
(function (PlayBallTrait) {
    PlayBallTrait[PlayBallTrait["CONSERVATIVE"] = 0] = "CONSERVATIVE";
    PlayBallTrait[PlayBallTrait["BALANCED"] = 1] = "BALANCED";
    PlayBallTrait[PlayBallTrait["AGGRESSIVE"] = 2] = "AGGRESSIVE";
})(PlayBallTrait || (exports.PlayBallTrait = PlayBallTrait = {}));
var PenaltyTrait;
(function (PenaltyTrait) {
    PenaltyTrait[PenaltyTrait["UNDISCIPLINED"] = 0] = "UNDISCIPLINED";
    PenaltyTrait[PenaltyTrait["NORMAL"] = 1] = "NORMAL";
    PenaltyTrait[PenaltyTrait["DISCIPLINED"] = 2] = "DISCIPLINED";
})(PenaltyTrait || (exports.PenaltyTrait = PenaltyTrait = {}));
var QBStyleTrait;
(function (QBStyleTrait) {
    QBStyleTrait[QBStyleTrait["POCKET"] = 0] = "POCKET";
    QBStyleTrait[QBStyleTrait["BALANCED"] = 1] = "BALANCED";
    QBStyleTrait[QBStyleTrait["SCRAMBLING"] = 2] = "SCRAMBLING";
})(QBStyleTrait || (exports.QBStyleTrait = QBStyleTrait = {}));
var LBStyleTrait;
(function (LBStyleTrait) {
    LBStyleTrait[LBStyleTrait["PASS_RUSH"] = 0] = "PASS_RUSH";
    LBStyleTrait[LBStyleTrait["BALANCED"] = 1] = "BALANCED";
    LBStyleTrait[LBStyleTrait["COVER_LB"] = 2] = "COVER_LB";
})(LBStyleTrait || (exports.LBStyleTrait = LBStyleTrait = {}));
exports.POSITIONS = [
    // Offense
    "QB", // Quarterback
    "HB", // Halfback/Running Back
    "FB", // Fullback
    "WR", // Wide Receiver
    "TE", // Tight End
    "LT", // Left Tackle
    "LG", // Left Guard
    "C", // Center
    "RG", // Right Guard
    "RT", // Right Tackle
    // Defense
    "LE", // Left End
    "RE", // Right End
    "DT", // Defensive Tackle
    "LOLB", // Left Outside Linebacker
    "MLB", // Middle Linebacker
    "ROLB", // Right Outside Linebacker
    "CB", // Cornerback
    "FS", // Free Safety
    "SS", // Strong Safety
    // Special Teams
    "K", // Kicker
    "P" // Punter
];
exports.POSITION_GROUP = ["OL", "DL", "DB"];
exports.oLinePositions = ["LT", "LG", "C", "RG", "RT"];
exports.dLinePositions = ["LE", "RE", "DT", "LOLB", "ROLB"];
exports.dbPositions = ["CB", "FS", "SS"];
//# sourceMappingURL=madden_league_types.js.map