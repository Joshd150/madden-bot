"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = __importDefault(require("../db/firebase"));
const node_cache_1 = __importDefault(require("node-cache"));
const ea_client_1 = require("./ea_client");
const config_1 = require("../config");
const changeCache = new node_cache_1.default();
const hash = require("object-hash");
async function getLatestLeagues() {
    const collection = firebase_1.default.collection("league_data");
    const docs = await collection.get();
    let leagues = docs.docs.map(d => d.id);
    collection.onSnapshot(querySnapshot => {
        console.log("Leagues being updated");
        leagues = querySnapshot.docs.map(d => d.id);
    });
    return {
        getLatestLeagues() {
            return leagues;
        }
    };
}
async function checkLeague(leagueId) {
    console.log(`Checking league ${leagueId}`);
    const client = await (0, ea_client_1.storedTokenClient)(Number(leagueId));
    const leagueData = await client.getLeagueInfo(Number(leagueId));
    const leagueHash = {
        currentWeek: leagueData.careerHubInfo.seasonInfo.seasonWeek,
        currentGames: leagueData.gameScheduleHubInfo.leagueSchedule.map(game => game.seasonGameInfo.result),
    };
    const newHash = hash(leagueHash);
    if (newHash !== changeCache.get(leagueId)) {
        console.log(`Detected change in ${leagueId}`);
        await fetch(`https://${config_1.DEPLOYMENT_URL}/dashboard/league/${leagueId}/export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                exportOption: "Current Week"
            })
        });
        changeCache.set(leagueId, newHash);
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function runLeagueChecks() {
    const latestLeagues = await getLatestLeagues();
    while (true) {
        const leagues = latestLeagues.getLatestLeagues();
        for (const leagueId of leagues) {
            // avoid any overloading of EA
            await sleep(5000);
            try {
                await checkLeague(leagueId);
            }
            catch (e) {
                console.error(`Error checking league ${leagueId}: ${e}`);
            }
        }
        console.log("Check complete, sleeping for 5 minutes...\n");
        await fetch("https://hc-ping.com/82b9220a-02cf-4ca1-9385-3c8b9463cff3");
        await sleep(5 * 60 * 1000);
    }
}
runLeagueChecks();
//# sourceMappingURL=ea_refresher.js.map