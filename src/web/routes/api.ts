import Router from "@koa/router";
import { ParameterizedContext } from "koa";
import db from "../../db/firebase";

interface VFLTeam {
  id: string;
  name: string;
  city?: string;
  conference?: string;
  division?: string;
  record?: { wins: number; losses: number; ties?: number };
  stats?: { pointsFor?: number; pointsAgainst?: number };
  [key: string]: any;
}

interface VFLPlayer {
  id: string;
  firstName?: string;
  lastName?: string;
  teamId?: string;
  stats?: { [key: string]: number };
  [key: string]: any;
}

interface VFLGame {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  status: string;
  gameDate: Date;
  week?: number;
  homeScore?: number;
  awayScore?: number;
  [key: string]: any;
}

interface VFLTrade {
  id: string;
  tradeDate: Date;
  [key: string]: any;
}

interface VFLNews {
  id: string;
  publishDate: Date;
  [key: string]: any;
}

const router = new Router({ prefix: "/api/vfl" });

async function apiErrorHandler(ctx: ParameterizedContext, next: Function) {
  try {
    await next();
  } catch (error) {
    console.error('VFL API Error:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

router.use(apiErrorHandler);

router.get("/stats/summary", async (ctx) => {
  try {
    const tradesSnapshot = await db.collection('vfl_trades')
      .where('tradeDate', '>=', new Date(new Date().getFullYear(), 0, 1))
      .get();

    const teamsSnapshot = await db.collection('vfl_teams').get();

    const gamesSnapshot = await db.collection('vfl_games')
      .orderBy('gameDate', 'desc')
      .limit(1)
      .get();

    let currentWeek = 1;
    if (!gamesSnapshot.empty) {
      const g = gamesSnapshot.docs[0].data() as VFLGame;
      currentWeek = g.week || 1;
    }

    ctx.body = {
      totalTrades: tradesSnapshot.size,
      activeTeams: teamsSnapshot.size,
      currentWeek
    };

  } catch (error) {
    console.error('Error fetching summary stats:', error);
    ctx.body = {
      totalTrades: 0,
      activeTeams: 32,
      currentWeek: 1
    };
  }
});

router.get("/news/recent", async (ctx) => {
  try {
    const newsSnapshot = await db.collection('vfl_news')
      .where('published', '==', true)
      .orderBy('publishDate', 'desc')
      .limit(6)
      .get();

    const news: VFLNews[] = newsSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        publishDate: d.publishDate?.toDate ? d.publishDate.toDate() : d.publishDate
      };
    });

    ctx.body = news;

  } catch (error) {
    console.error('Error fetching news:', error);
    ctx.status = 404;
    ctx.body = { error: "News not found" };
  }
});

router.get("/trades/recent", async (ctx) => {
  const limit = parseInt(ctx.query.limit as string) || 10;

  try {
    const tradesSnapshot = await db.collection('vfl_trades')
      .orderBy('tradeDate', 'desc')
      .limit(limit)
      .get();

    const trades: VFLTrade[] = tradesSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        tradeDate: d.tradeDate?.toDate ? d.tradeDate.toDate() : d.tradeDate
      };
    });

    ctx.body = trades;

  } catch (error) {
    console.error('Error fetching recent trades:', error);
    ctx.status = 404;
    ctx.body = { error: "Trades not found" };
  }
});

router.get("/games/recent", async (ctx) => {
  const limit = parseInt(ctx.query.limit as string) || 10;

  try {
    const gamesSnapshot = await db.collection('vfl_games')
      .where('status', '==', 'completed')
      .orderBy('gameDate', 'desc')
      .limit(limit)
      .get();

    const games: VFLGame[] = gamesSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        homeTeamName: d.homeTeamName || "",
        awayTeamName: d.awayTeamName || "",
        status: d.status || "",
        gameDate: d.gameDate?.toDate ? d.gameDate.toDate() : d.gameDate,
        week: d.week,
        homeScore: d.homeScore,
        awayScore: d.awayScore,
        ...d
      };
    });

    ctx.body = games;

  } catch (error) {
    console.error('Error fetching recent games:', error);
    ctx.status = 404;
    ctx.body = { error: "Games not found" };
  }
});

router.get("/games/schedule", async (ctx) => {
  const view = ctx.query.view as string || 'upcoming';
  const week = ctx.query.week as string;
  const limit = parseInt(ctx.query.limit as string) || 20;

  try {
    let query: FirebaseFirestore.Query = db.collection('vfl_games');

    if (view === 'upcoming') {
      query = query.where('status', '==', 'scheduled');
    } else {
      query = query.where('status', '==', 'completed');
    }

    if (week && week !== 'current') {
      query = query.where('week', '==', parseInt(week));
    }

    // @ts-ignore
    const orderDirection = view === 'upcoming' ? 'asc' : 'desc';
    query = query.orderBy('gameDate', orderDirection).limit(limit);

    const gamesSnapshot = await query.get();

    const games: VFLGame[] = gamesSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        homeTeamName: d.homeTeamName || "",
        awayTeamName: d.awayTeamName || "",
        status: d.status || "",
        gameDate: d.gameDate?.toDate ? d.gameDate.toDate() : d.gameDate,
        week: d.week,
        homeScore: d.homeScore,
        awayScore: d.awayScore,
        ...d
      };
    });

    ctx.body = games;

  } catch (error) {
    console.error('Error fetching schedule:', error);
    ctx.status = 404;
    ctx.body = { error: "Schedule not found" };
  }
});

router.get("/teams", async (ctx) => {
  try {
    const teamsSnapshot = await db.collection('vfl_teams')
      .orderBy('conference')
      .orderBy('division')
      .orderBy('name')
      .get();

    const teams: VFLTeam[] = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VFLTeam));

    ctx.body = teams;

  } catch (error) {
    console.error('Error fetching teams:', error);
    ctx.status = 404;
    ctx.body = { error: "Teams not found" };
  }
});

router.get("/teams/rankings", async (ctx) => {
  try {
    const teamsSnapshot = await db.collection('vfl_teams').get();

    let teams: VFLTeam[] = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VFLTeam));

    teams = teams
      .filter(team => team.record)
      .sort((a, b) => {
        if (a.record!.wins !== b.record!.wins) {
          return b.record!.wins - a.record!.wins;
        }
        const aWinPct = a.record!.wins / (a.record!.wins + a.record!.losses + (a.record!.ties || 0));
        const bWinPct = b.record!.wins / (b.record!.wins + b.record!.losses + (b.record!.ties || 0));
        if (aWinPct !== bWinPct) {
          return bWinPct - aWinPct;
        }
        const aDiff = (a.stats?.pointsFor || 0) - (a.stats?.pointsAgainst || 0);
        const bDiff = (b.stats?.pointsFor || 0) - (b.stats?.pointsAgainst || 0);
        return bDiff - aDiff;
      });

    ctx.body = teams;

  } catch (error) {
    console.error('Error fetching team rankings:', error);
    ctx.status = 404;
    ctx.body = { error: "Rankings not found" };
  }
});

router.get("/teams/:teamId", async (ctx) => {
  const { teamId } = ctx.params;

  try {
    const teamDoc = await db.collection('vfl_teams').doc(teamId).get();

    if (!teamDoc.exists) {
      ctx.status = 404;
      ctx.body = { error: "Team not found" };
      return;
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as VFLTeam;

    const recentGamesSnapshot = await db.collection('vfl_games')
      .where('homeTeamName', '==', team.name)
      .orderBy('gameDate', 'desc')
      .limit(5)
      .get();

    const awayGamesSnapshot = await db.collection('vfl_games')
      .where('awayTeamName', '==', team.name)
      .orderBy('gameDate', 'desc')
      .limit(5)
      .get();

    const allGames: VFLGame[] = [];
    [...recentGamesSnapshot.docs, ...awayGamesSnapshot.docs].forEach(doc => {
      const d = doc.data();
      allGames.push({
        id: doc.id,
        homeTeamName: d.homeTeamName || "",
        awayTeamName: d.awayTeamName || "",
        status: d.status || "",
        gameDate: d.gameDate?.toDate ? d.gameDate.toDate() : d.gameDate,
        week: d.week,
        homeScore: d.homeScore,
        awayScore: d.awayScore,
        ...d
      });
    });

    const recentGames = allGames
      .sort((a, b) => a.gameDate && b.gameDate ? b.gameDate.getTime() - a.gameDate.getTime() : 0)
      .slice(0, 5);

    ctx.body = {
      ...team,
      recentGames
    };

  } catch (error) {
    console.error('Error fetching team details:', error);
    ctx.status = 404;
    ctx.body = { error: "Team not found" };
  }
});

router.get("/stats/leaders/:category", async (ctx) => {
  const { category } = ctx.params;
  const limit = parseInt(ctx.query.limit as string) || 20;

  try {
    const playersSnapshot = await db.collection('vfl_players')
      .limit(limit * 2)
      .get();

    let players: VFLPlayer[] = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VFLPlayer));

    players = players
      .filter(player => player.stats && typeof player.stats[category] === "number")
      .sort((a, b) => ((b.stats?.[category] || 0) - (a.stats?.[category] || 0)))
      .slice(0, limit)
      .map(player => ({
        ...player,
        statValue: player.stats?.[category] || 0
      }));

    ctx.body = players;

  } catch (error) {
    console.error('Error fetching stat leaders:', error);
    ctx.status = 404;
    ctx.body = { error: "Statistical leaders not found" };
  }
});

router.get("/players/:playerId", async (ctx) => {
  const { playerId } = ctx.params;

  try {
    const playerDoc = await db.collection('vfl_players').doc(playerId).get();

    if (!playerDoc.exists) {
      ctx.status = 404;
      ctx.body = { error: "Player not found" };
      return;
    }

    const player = { id: playerDoc.id, ...playerDoc.data() } as VFLPlayer;

    if (player.teamId) {
      const teamDoc = await db.collection('vfl_teams').doc(player.teamId).get();
      if (teamDoc.exists) {
        (player as any).team = teamDoc.data();
      }
    }

    ctx.body = player;

  } catch (error) {
    console.error('Error fetching player details:', error);
    ctx.status = 404;
    ctx.body = { error: "Player not found" };
  }
});

router.get("/games/:gameId", async (ctx) => {
  const { gameId } = ctx.params;

  try {
    const gameDoc = await db.collection('vfl_games').doc(gameId).get();

    if (!gameDoc.exists) {
      ctx.status = 404;
      ctx.body = { error: "Game not found" };
      return;
    }

    const d = gameDoc.data();
    const game: VFLGame = {
      id: gameDoc.id,
      homeTeamName: d.homeTeamName || "",
      awayTeamName: d.awayTeamName || "",
      status: d.status || "",
      gameDate: d?.gameDate?.toDate ? d.gameDate.toDate() : d?.gameDate,
      week: d.week,
      homeScore: d.homeScore,
      awayScore: d.awayScore,
      ...d
    };

    ctx.body = game;

  } catch (error) {
    console.error('Error fetching game details:', error);
    ctx.status = 404;
    ctx.body = { error: "Game not found" };
  }
});

router.get("/health", async (ctx) => {
  try {
    await db.collection('vfl_config').limit(1).get();

    ctx.body = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

  } catch (error) {
    ctx.status = 503;
    ctx.body = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
});

export default router;
