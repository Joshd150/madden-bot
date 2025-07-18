"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = __importDefault(require("@koa/router"));
const firebase_1 = __importDefault(require("../../db/firebase"));
/**
 * VFL Manager API Routes - The data highway for our web interface!
 *
 * These API endpoints serve data from our Firestore database to the web interface.
 * They use the exact same database and data structures as our Discord bot, ensuring
 * perfect consistency between the bot and website.
 *
 * Think of these as the bridge between our beautiful web interface and the rich
 * data that our Discord bot manages. Every endpoint is designed to be fast,
 * reliable, and provide exactly the data our frontend needs.
 */
const router = new router_1.default({ prefix: "/api/vfl" });
/**
 * Middleware to handle API errors gracefully
 * This ensures our users get helpful error messages instead of cryptic failures
 */
async function apiErrorHandler(ctx, next) {
    try {
        await next();
    }
    catch (error) {
        console.error('VFL API Error:', error);
        ctx.status = 500;
        ctx.body = {
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
router.use(apiErrorHandler);
/**
 * GET /api/vfl/stats/summary
 * Returns high-level statistics for the hero section
 * This gives visitors an immediate sense of how active our league is
 */
router.get("/stats/summary", async (ctx) => {
    try {
        // Get total trades this season
        const tradesSnapshot = await firebase_1.default.collection('vfl_trades')
            .where('tradeDate', '>=', new Date(new Date().getFullYear(), 0, 1)) // This year
            .get();
        // Get total active teams
        const teamsSnapshot = await firebase_1.default.collection('vfl_teams').get();
        // Get current week from the most recent game
        const gamesSnapshot = await firebase_1.default.collection('vfl_games')
            .orderBy('gameDate', 'desc')
            .limit(1)
            .get();
        const currentWeek = gamesSnapshot.empty ? 1 : gamesSnapshot.docs[0].data().week;
        ctx.body = {
            totalTrades: tradesSnapshot.size,
            activeTeams: teamsSnapshot.size,
            currentWeek: currentWeek
        };
    }
    catch (error) {
        console.error('Error fetching summary stats:', error);
        // Return default values if there's an error
        ctx.body = {
            totalTrades: 0,
            activeTeams: 32,
            currentWeek: 1
        };
    }
});
/**
 * GET /api/vfl/news/recent
 * Returns recent news and updates
 * Keeps our community informed about league happenings
 */
router.get("/news/recent", async (ctx) => {
    try {
        const newsSnapshot = await firebase_1.default.collection('vfl_news')
            .where('published', '==', true)
            .orderBy('publishDate', 'desc')
            .limit(6)
            .get();
        const news = newsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            publishDate: doc.data().publishDate.toDate()
        }));
        ctx.body = news;
    }
    catch (error) {
        console.error('Error fetching news:', error);
        ctx.status = 404;
        ctx.body = { error: "News not found" };
    }
});
/**
 * GET /api/vfl/trades/recent
 * Returns recent trades with optional limit
 * Everyone loves to see the latest wheeling and dealing!
 */
router.get("/trades/recent", async (ctx) => {
    const limit = parseInt(ctx.query.limit) || 10;
    try {
        const tradesSnapshot = await firebase_1.default.collection('vfl_trades')
            .orderBy('tradeDate', 'desc')
            .limit(limit)
            .get();
        const trades = tradesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            tradeDate: doc.data().tradeDate.toDate()
        }));
        ctx.body = trades;
    }
    catch (error) {
        console.error('Error fetching recent trades:', error);
        ctx.status = 404;
        ctx.body = { error: "Trades not found" };
    }
});
/**
 * GET /api/vfl/games/recent
 * Returns recent completed games
 * Perfect for checking the latest results
 */
router.get("/games/recent", async (ctx) => {
    const limit = parseInt(ctx.query.limit) || 10;
    try {
        const gamesSnapshot = await firebase_1.default.collection('vfl_games')
            .where('status', '==', 'completed')
            .orderBy('gameDate', 'desc')
            .limit(limit)
            .get();
        const games = gamesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            gameDate: doc.data().gameDate.toDate()
        }));
        ctx.body = games;
    }
    catch (error) {
        console.error('Error fetching recent games:', error);
        ctx.status = 404;
        ctx.body = { error: "Games not found" };
    }
});
/**
 * GET /api/vfl/games/schedule
 * Returns game schedule with filtering options
 * Essential for planning your viewing schedule
 */
router.get("/games/schedule", async (ctx) => {
    const view = ctx.query.view || 'upcoming'; // 'upcoming' or 'completed'
    const week = ctx.query.week;
    const limit = parseInt(ctx.query.limit) || 20;
    try {
        let query = firebase_1.default.collection('vfl_games');
        // Filter by game status
        if (view === 'upcoming') {
            query = query.where('status', '==', 'scheduled');
        }
        else {
            query = query.where('status', '==', 'completed');
        }
        // Filter by week if specified
        if (week && week !== 'current') {
            query = query.where('week', '==', parseInt(week));
        }
        // Order and limit
        const orderDirection = view === 'upcoming' ? 'asc' : 'desc';
        query = query.orderBy('gameDate', orderDirection).limit(limit);
        const gamesSnapshot = await query.get();
        const games = gamesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            gameDate: doc.data().gameDate.toDate()
        }));
        ctx.body = games;
    }
    catch (error) {
        console.error('Error fetching schedule:', error);
        ctx.status = 404;
        ctx.body = { error: "Schedule not found" };
    }
});
/**
 * GET /api/vfl/teams
 * Returns all teams in the league
 * The foundation of our league structure
 */
router.get("/teams", async (ctx) => {
    try {
        const teamsSnapshot = await firebase_1.default.collection('vfl_teams')
            .orderBy('conference')
            .orderBy('division')
            .orderBy('name')
            .get();
        const teams = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        ctx.body = teams;
    }
    catch (error) {
        console.error('Error fetching teams:', error);
        ctx.status = 404;
        ctx.body = { error: "Teams not found" };
    }
});
/**
 * GET /api/vfl/teams/rankings
 * Returns teams ranked by performance
 * For the competitive folks who want to see standings
 */
router.get("/teams/rankings", async (ctx) => {
    try {
        const teamsSnapshot = await firebase_1.default.collection('vfl_teams')
            .get();
        let teams = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Filter teams that have records and sort them
        teams = teams
            .filter(team => team.record)
            .sort((a, b) => {
            // Sort by wins first
            if (a.record.wins !== b.record.wins) {
                return b.record.wins - a.record.wins;
            }
            // Then by win percentage
            const aWinPct = a.record.wins / (a.record.wins + a.record.losses + (a.record.ties || 0));
            const bWinPct = b.record.wins / (b.record.wins + b.record.losses + (b.record.ties || 0));
            if (aWinPct !== bWinPct) {
                return bWinPct - aWinPct;
            }
            // Finally by point differential
            const aDiff = (a.stats?.pointsFor || 0) - (a.stats?.pointsAgainst || 0);
            const bDiff = (b.stats?.pointsFor || 0) - (b.stats?.pointsAgainst || 0);
            return bDiff - aDiff;
        });
        ctx.body = teams;
    }
    catch (error) {
        console.error('Error fetching team rankings:', error);
        ctx.status = 404;
        ctx.body = { error: "Rankings not found" };
    }
});
/**
 * GET /api/vfl/teams/:teamId
 * Returns detailed information about a specific team
 * Perfect for team-focused pages and detailed views
 */
router.get("/teams/:teamId", async (ctx) => {
    const { teamId } = ctx.params;
    try {
        const teamDoc = await firebase_1.default.collection('vfl_teams').doc(teamId).get();
        if (!teamDoc.exists) {
            ctx.status = 404;
            ctx.body = { error: "Team not found" };
            return;
        }
        const team = { id: teamDoc.id, ...teamDoc.data() };
        // Get team's recent games
        const recentGamesSnapshot = await firebase_1.default.collection('vfl_games')
            .where('homeTeamName', '==', team.name)
            .orderBy('gameDate', 'desc')
            .limit(5)
            .get();
        const awayGamesSnapshot = await firebase_1.default.collection('vfl_games')
            .where('awayTeamName', '==', team.name)
            .orderBy('gameDate', 'desc')
            .limit(5)
            .get();
        // Combine and sort recent games
        const allGames = [];
        [...recentGamesSnapshot.docs, ...awayGamesSnapshot.docs].forEach(doc => {
            allGames.push({
                id: doc.id,
                ...doc.data(),
                gameDate: doc.data().gameDate.toDate()
            });
        });
        const recentGames = allGames
            .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime())
            .slice(0, 5);
        ctx.body = {
            ...team,
            recentGames
        };
    }
    catch (error) {
        console.error('Error fetching team details:', error);
        ctx.status = 404;
        ctx.body = { error: "Team not found" };
    }
});
/**
 * GET /api/vfl/stats/leaders/:category
 * Returns statistical leaders for a specific category
 * The bread and butter for stat enthusiasts
 */
router.get("/stats/leaders/:category", async (ctx) => {
    const { category } = ctx.params;
    const limit = parseInt(ctx.query.limit) || 20;
    try {
        // This is a simplified version - in a real implementation, you'd have
        // a more sophisticated stats tracking system
        const playersSnapshot = await firebase_1.default.collection('vfl_players')
            .limit(limit * 2) // Get more than we need for filtering
            .get();
        let players = playersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Filter and sort based on category
        // This is mock data - you'd implement real stat tracking
        players = players
            .filter(player => player.stats && player.stats[category])
            .sort((a, b) => (b.stats[category] || 0) - (a.stats[category] || 0))
            .slice(0, limit)
            .map(player => ({
            ...player,
            statValue: player.stats[category] || 0
        }));
        ctx.body = players;
    }
    catch (error) {
        console.error('Error fetching stat leaders:', error);
        ctx.status = 404;
        ctx.body = { error: "Statistical leaders not found" };
    }
});
/**
 * GET /api/vfl/players/:playerId
 * Returns detailed player information
 * For when you want to dive deep into a player's profile
 */
router.get("/players/:playerId", async (ctx) => {
    const { playerId } = ctx.params;
    try {
        const playerDoc = await firebase_1.default.collection('vfl_players').doc(playerId).get();
        if (!playerDoc.exists) {
            ctx.status = 404;
            ctx.body = { error: "Player not found" };
            return;
        }
        const player = { id: playerDoc.id, ...playerDoc.data() };
        // Get player's team information
        if (player.teamId) {
            const teamDoc = await firebase_1.default.collection('vfl_teams').doc(player.teamId).get();
            if (teamDoc.exists) {
                player.team = teamDoc.data();
            }
        }
        ctx.body = player;
    }
    catch (error) {
        console.error('Error fetching player details:', error);
        ctx.status = 404;
        ctx.body = { error: "Player not found" };
    }
});
/**
 * GET /api/vfl/games/:gameId
 * Returns detailed game information including stats
 * Perfect for game breakdown pages
 */
router.get("/games/:gameId", async (ctx) => {
    const { gameId } = ctx.params;
    try {
        const gameDoc = await firebase_1.default.collection('vfl_games').doc(gameId).get();
        if (!gameDoc.exists) {
            ctx.status = 404;
            ctx.body = { error: "Game not found" };
            return;
        }
        const game = {
            id: gameDoc.id,
            ...gameDoc.data(),
            gameDate: gameDoc.data().gameDate.toDate()
        };
        ctx.body = game;
    }
    catch (error) {
        console.error('Error fetching game details:', error);
        ctx.status = 404;
        ctx.body = { error: "Game not found" };
    }
});
/**
 * GET /api/vfl/health
 * Health check endpoint for monitoring
 * Useful for ensuring our API is running smoothly
 */
router.get("/health", async (ctx) => {
    try {
        // Test database connection
        await firebase_1.default.collection('vfl_config').limit(1).get();
        ctx.body = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }
    catch (error) {
        ctx.status = 503;
        ctx.body = {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
});
exports.default = router;
//# sourceMappingURL=api.js.map