import Router from "@koa/router";
import { ParameterizedContext } from "koa";
import MaddenDB from "../../db/madden_db";
import { Standing, Player, Team } from "../../export/madden_league_types";

const router = new Router({ prefix: "/api" });

// Middleware to handle API errors
async function apiErrorHandler(ctx: ParameterizedContext, next: Function) {
  try {
    await next();
  } catch (error) {
    console.error('API Error:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

router.use(apiErrorHandler);

// Get league summary statistics
router.get("/league/stats/summary", async (ctx) => {
  // For now, return mock data. In production, this would query actual league data
  const leagueId = "3418359"; // Default league ID - should be configurable
  
  try {
    const teams = await MaddenDB.getLatestTeams(leagueId);
    const standings = await MaddenDB.getLatestStandings(leagueId);
    
    // Calculate total games played
    const totalGames = standings.reduce((sum, team) => sum + team.totalWins + team.totalLosses + team.totalTies, 0) / 2;
    
    // Get current week from standings (assuming all teams are in same week)
    const currentWeek = standings.length > 0 ? standings[0].weekIndex + 1 : 1;
    
    ctx.body = {
      totalGames: Math.floor(totalGames),
      activeTeams: teams.getLatestTeams().length,
      currentWeek: currentWeek
    };
  } catch (error) {
    ctx.body = {
      totalGames: 0,
      activeTeams: 32,
      currentWeek: 1
    };
  }
});

// Get league standings
router.get("/league/standings", async (ctx) => {
  const leagueId = "3418359"; // Default league ID
  
  try {
    const standings = await MaddenDB.getLatestStandings(leagueId);
    const teams = await MaddenDB.getLatestTeams(leagueId);
    
    // Enhance standings with team information
    const enhancedStandings = standings.map(standing => {
      const team = teams.getTeamForId(standing.teamId);
      return {
        ...standing,
        displayName: team.displayName,
        cityName: team.cityName,
        abbrName: team.abbrName
      };
    });
    
    ctx.body = enhancedStandings;
  } catch (error) {
    ctx.status = 404;
    ctx.body = { error: "Standings not found" };
  }
});

// Get league teams
router.get("/league/teams", async (ctx) => {
  const leagueId = "3418359"; // Default league ID
  
  try {
    const teams = await MaddenDB.getLatestTeams(leagueId);
    const standings = await MaddenDB.getLatestStandings(leagueId);
    
    // Enhance teams with standings information
    const enhancedTeams = teams.getLatestTeams().map(team => {
      const standing = standings.find(s => s.teamId === team.teamId);
      return {
        ...team,
        totalWins: standing?.totalWins || 0,
        totalLosses: standing?.totalLosses || 0,
        totalTies: standing?.totalTies || 0,
        ptsFor: standing?.ptsFor || 0,
        ptsAgainst: standing?.ptsAgainst || 0
      };
    });
    
    ctx.body = enhancedTeams;
  } catch (error) {
    ctx.status = 404;
    ctx.body = { error: "Teams not found" };
  }
});

// Get statistical leaders
router.get("/league/leaders/:category", async (ctx) => {
  const { category } = ctx.params;
  const leagueId = "3418359"; // Default league ID
  
  try {
    const players = await MaddenDB.getLatestPlayers(leagueId);
    const teams = await MaddenDB.getLatestTeams(leagueId);
    
    // For now, return mock statistical data
    // In production, this would query actual player statistics
    const mockStats = generateMockStats(players, teams, category);
    
    ctx.body = mockStats;
  } catch (error) {
    ctx.status = 404;
    ctx.body = { error: "Statistical leaders not found" };
  }
});

// Get player details
router.get("/league/players/:playerId", async (ctx) => {
  const { playerId } = ctx.params;
  const leagueId = "3418359"; // Default league ID
  
  try {
    const player = await MaddenDB.getPlayer(leagueId, playerId);
    const teams = await MaddenDB.getLatestTeams(leagueId);
    const team = teams.getTeamForId(player.teamId);
    
    const playerStats = await MaddenDB.getPlayerStats(leagueId, player);
    
    ctx.body = {
      ...player,
      teamName: team.displayName,
      stats: playerStats
    };
  } catch (error) {
    ctx.status = 404;
    ctx.body = { error: "Player not found" };
  }
});

// Get team details
router.get("/league/teams/:teamId", async (ctx) => {
  const { teamId } = ctx.params;
  const leagueId = "3418359"; // Default league ID
  
  try {
    const teams = await MaddenDB.getLatestTeams(leagueId);
    const team = teams.getTeamForId(parseInt(teamId));
    const standing = await MaddenDB.getStandingForTeam(leagueId, parseInt(teamId));
    
    // Get team roster
    const roster = await MaddenDB.getPlayers(leagueId, { teamId: parseInt(teamId) }, 100);
    
    ctx.body = {
      ...team,
      standing,
      roster
    };
  } catch (error) {
    ctx.status = 404;
    ctx.body = { error: "Team not found" };
  }
});

// Helper function to generate mock statistical data
function generateMockStats(players: Player[], teams: any, category: string) {
  const playersWithTeams = players.slice(0, 20).map(player => {
    const team = teams.getTeamForId(player.teamId);
    return {
      ...player,
      teamName: team.displayName
    };
  });

  // Add mock statistical values based on category
  return playersWithTeams.map(player => {
    switch (category) {
      case 'passing':
        return {
          ...player,
          passingYards: Math.floor(Math.random() * 3000) + 1000,
          touchdowns: Math.floor(Math.random() * 25) + 5,
          interceptions: Math.floor(Math.random() * 10) + 1
        };
      case 'rushing':
        return {
          ...player,
          rushingYards: Math.floor(Math.random() * 1200) + 300,
          touchdowns: Math.floor(Math.random() * 15) + 2,
          attempts: Math.floor(Math.random() * 200) + 50
        };
      case 'receiving':
        return {
          ...player,
          receivingYards: Math.floor(Math.random() * 1000) + 200,
          receptions: Math.floor(Math.random() * 80) + 20,
          touchdowns: Math.floor(Math.random() * 12) + 1
        };
      case 'defensive':
        return {
          ...player,
          tackles: Math.floor(Math.random() * 100) + 30,
          sacks: Math.floor(Math.random() * 15) + 1,
          interceptions: Math.floor(Math.random() * 8) + 0
        };
      default:
        return player;
    }
  }).sort((a, b) => {
    // Sort by primary stat for each category
    switch (category) {
      case 'passing':
        return (b as any).passingYards - (a as any).passingYards;
      case 'rushing':
        return (b as any).rushingYards - (a as any).rushingYards;
      case 'receiving':
        return (b as any).receivingYards - (a as any).receivingYards;
      case 'defensive':
        return (b as any).tackles - (a as any).tackles;
      default:
        return 0;
    }
  });
}

export default router;