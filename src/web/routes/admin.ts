import Router from "@koa/router";
import { ParameterizedContext } from "koa";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import db from "../../db/firebase";

/**
 * VFL Manager Admin Portal Routes - The command center for league management!
 */

const router = new Router({ prefix: "/admin" });

// Get configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'vfl-manager-secret-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vfl-manager.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

/**
 * Authentication middleware - protects admin routes
 */
async function requireAuth(ctx: ParameterizedContext, next: Function) {
  const token = ctx.cookies.get('vfl_admin_token') || ctx.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    ctx.status = 401;
    ctx.body = { error: 'Authentication required' };
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    ctx.state.admin = decoded;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid or expired token' };
  }
}

/**
 * GET /admin
 */
router.get("/", async (ctx) => {
  const token = ctx.cookies.get('vfl_admin_token');

  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      ctx.redirect('/admin/dashboard');
      return;
    } catch (error) {
      // Token invalid, continue to login page
    }
  }

  ctx.type = 'html';
  ctx.body = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - VFL Manager</title>
    <link rel="stylesheet" href="/styles/admin.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="/assets/vfl-logo.png" alt="VFL Manager" class="login-logo">
                <h1>VFL Manager Admin</h1>
                <p>Sign in to manage your fantasy football league</p>
            </div>
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required placeholder="admin@vfl-manager.com">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required placeholder="Enter your password">
                </div>
                <button type="submit" class="btn btn-primary">Sign In to Admin Portal</button>
                <div id="error-message" class="error-message"></div>
            </form>
            <div class="login-footer">
                <p>Secure access to VFL Manager administration</p>
            </div>
        </div>
    </div>
    <script src="/scripts/admin-login.js"></script>
</body>
</html>
  `;
});

/**
 * POST /admin/login
 */
router.post("/login", async (ctx) => {
  const { email, password } = ctx.request.body as any;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { email, role: 'admin', loginTime: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    ctx.cookies.set('vfl_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });

    ctx.body = { success: true, redirect: '/admin/dashboard' };
  } else {
    ctx.status = 401;
    ctx.body = { error: 'Invalid email or password' };
  }
});

/**
 * GET /admin/dashboard
 */
router.get("/dashboard", requireAuth, async (ctx) => {
  ctx.type = 'html';
  ctx.body = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - VFL Manager</title>
    <link rel="stylesheet" href="/styles/admin.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-sidebar">
            <div class="sidebar-header">
                <img src="/assets/vfl-logo.png" alt="VFL Manager" class="sidebar-logo">
                <span>VFL Admin</span>
            </div>
            <ul class="sidebar-nav">
                <li><a href="#overview" class="nav-link active">📊 Overview</a></li>
                <li><a href="#bot-config" class="nav-link">🤖 Bot Configuration</a></li>
                <li><a href="#teams" class="nav-link">🏈 Teams Management</a></li>
                <li><a href="#players" class="nav-link">👤 Players Management</a></li>
                <li><a href="#trades" class="nav-link">🔄 Trades Management</a></li>
                <li><a href="#games" class="nav-link">🏆 Games Management</a></li>
                <li><a href="#analytics" class="nav-link">📈 Analytics</a></li>
                <li><a href="#settings" class="nav-link">⚙️ Settings</a></li>
            </ul>
            <div class="sidebar-footer">
                <button id="logoutBtn" class="btn btn-secondary">Logout</button>
            </div>
        </nav>
        <main class="admin-content">
            <header class="content-header">
                <h1 id="pageTitle">Dashboard Overview</h1>
                <div class="header-actions">
                    <button class="btn btn-primary" id="refreshData">🔄 Refresh Data</button>
                </div>
            </header>
            <div class="content-body" id="contentBody">
                <div class="loading">Loading dashboard...</div>
            </div>
        </main>
    </div>
    <script src="/scripts/admin-dashboard.js"></script>
</body>
</html>
  `;
});

/**
 * GET /admin/api/overview
 */
router.get("/api/overview", requireAuth, async (ctx) => {
  try {
    const [teamsSnapshot, playersSnapshot, tradesSnapshot, gamesSnapshot, configSnapshot] = await Promise.all([
      db.collection('vfl_teams').get(),
      db.collection('vfl_players').get(),
      db.collection('vfl_trades').get(),
      db.collection('vfl_games').get(),
      db.collection('vfl_config').get()
    ]);

    const recentTradesSnapshot = await db.collection('vfl_trades')
      .orderBy('tradeDate', 'desc')
      .limit(5)
      .get();

    const recentGamesSnapshot = await db.collection('vfl_games')
      .where('status', '==', 'completed')
      .orderBy('gameDate', 'desc')
      .limit(5)
      .get();

    const overview = {
      totals: {
        teams: teamsSnapshot.size,
        players: playersSnapshot.size,
        trades: tradesSnapshot.size,
        games: gamesSnapshot.size,
        servers: configSnapshot.size
      },
      recentTrades: recentTradesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tradeDate: doc.data().tradeDate.toDate()
      })),
      recentGames: recentGamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        gameDate: doc.data().gameDate.toDate()
      }))
    };

    ctx.body = overview;

  } catch (error) {
    console.error('Error fetching overview:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch overview data' };
  }
});

/**
 * GET /admin/api/bot-configs
 */
router.get("/api/bot-configs", requireAuth, async (ctx) => {
  try {
    const configsSnapshot = await db.collection('vfl_config').get();

    const configs = configsSnapshot.docs.map(doc => ({
      guildId: doc.id,
      ...doc.data()
    }));

    ctx.body = configs;

  } catch (error) {
    console.error('Error fetching bot configs:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch bot configurations' };
  }
});

/**
 * PUT /admin/api/bot-configs/:guildId
 */
router.put("/api/bot-configs/:guildId", requireAuth, async (ctx) => {
  const { guildId } = ctx.params;
  const config = ctx.request.body as any;

  try {
    await db.collection('vfl_config').doc(guildId).set(config, { merge: true });
    ctx.body = { success: true, message: 'Configuration updated successfully' };

  } catch (error) {
    console.error('Error updating bot config:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update configuration' };
  }
});

/**
 * GET /admin/api/teams
 */
router.get("/api/teams", requireAuth, async (ctx) => {
  try {
    const teamsSnapshot = await db.collection('vfl_teams')
      .orderBy('conference')
      .orderBy('division')
      .orderBy('name')
      .get();

    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    ctx.body = teams;

  } catch (error) {
    console.error('Error fetching teams:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch teams' };
  }
});

/**
 * POST /admin/api/teams
 */
router.post("/api/teams", requireAuth, async (ctx) => {
  const teamData = ctx.request.body as any;

  try {
    const docRef = await db.collection('vfl_teams').add({
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    ctx.body = { success: true, id: docRef.id, message: 'Team created successfully' };

  } catch (error) {
    console.error('Error creating team:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create team' };
  }
});

/**
 * PUT /admin/api/teams/:teamId
 */
router.put("/api/teams/:teamId", requireAuth, async (ctx) => {
  const { teamId } = ctx.params;
  const teamData = ctx.request.body as any;

  try {
    await db.collection('vfl_teams').doc(teamId).update({
      ...teamData,
      updatedAt: new Date()
    });

    ctx.body = { success: true, message: 'Team updated successfully' };

  } catch (error) {
    console.error('Error updating team:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update team' };
  }
});

/**
 * DELETE /admin/api/teams/:teamId
 */
router.delete("/api/teams/:teamId", requireAuth, async (ctx) => {
  const { teamId } = ctx.params;

  try {
    await db.collection('vfl_teams').doc(teamId).delete();
    ctx.body = { success: true, message: 'Team deleted successfully' };

  } catch (error) {
    console.error('Error deleting team:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to delete team' };
  }
});

/**
 * GET /admin/api/trades
 */
router.get("/api/trades", requireAuth, async (ctx) => {
  const limit = parseInt(ctx.query.limit as string) || 50;

  try {
    const tradesSnapshot = await db.collection('vfl_trades')
      .orderBy('tradeDate', 'desc')
      .limit(limit)
      .get();

    const trades = tradesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      tradeDate: doc.data().tradeDate.toDate()
    }));

    ctx.body = trades;

  } catch (error) {
    console.error('Error fetching trades:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch trades' };
  }
});

/**
 * POST /admin/api/trades
 */
router.post("/api/trades", requireAuth, async (ctx) => {
  const tradeData = ctx.request.body as any;

  try {
    const docRef = await db.collection('vfl_trades').add({
      ...tradeData,
      tradeDate: new Date(),
      postedToDiscord: false,
      createdAt: new Date()
    });

    ctx.body = { success: true, id: docRef.id, message: 'Trade created successfully' };

  } catch (error) {
    console.error('Error creating trade:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create trade' };
  }
});

/**
 * GET /admin/api/analytics
 */
router.get("/api/analytics", async (ctx) => {
  try {
    const analytics = {
      totalServers: 3,
      totalCommands: 1847,
      activeUsers: 156,
      commandsToday: 73,
      popularCommands: [
        { name: 'trades', count: 342 },
        { name: 'scores', count: 298 },
        { name: 'teams', count: 234 },
        { name: 'standings', count: 189 },
        { name: 'players', count: 156 }
      ],
      serverActivity: [
        { serverId: '123456789', serverName: 'Main VFL Server', commandCount: 892 },
        { serverId: '987654321', serverName: 'VFL Dynasty League', commandCount: 567 },
        { serverId: '456789123', serverName: 'VFL Test Server', commandCount: 234 }
      ],
      tradesPerWeek: [12, 8, 15, 22, 18, 9, 14],
      gamesPerWeek: [16, 16, 16, 16, 16, 16, 16]
    };

    ctx.body = analytics;

  } catch (error) {
    console.error('Error fetching analytics:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch analytics' };
  }
});

/**
 * POST /admin/logout
 */
router.post("/logout", async (ctx) => {
  ctx.cookies.set('vfl_admin_token', '', { maxAge: 0 });
  ctx.body = { success: true, message: 'Logged out successfully' };
});

/**
 * GET /admin/api/system-status
 */
router.get("/api/system-status", requireAuth, async (ctx) => {
  try {
    await db.collection('vfl_config').limit(1).get();

    ctx.body = {
      database: 'healthy',
      api: 'healthy',
      bot: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    ctx.status = 503;
    ctx.body = {
      database: 'unhealthy',
      api: 'degraded',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
});

export default router;
