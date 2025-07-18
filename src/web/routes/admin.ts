import Router from "@koa/router";
import { ParameterizedContext } from "koa";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { WEB_CONFIG } from "../../config";
import db from "../../db/firebase";
import { LeagueSettings } from "../../discord/settings_db";

const router = new Router({ prefix: "/admin" });

// Admin authentication middleware
async function requireAuth(ctx: ParameterizedContext, next: Function) {
  const token = ctx.cookies.get('admin_token') || ctx.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    ctx.status = 401;
    ctx.body = { error: 'Authentication required' };
    return;
  }

  try {
    const decoded = jwt.verify(token, WEB_CONFIG.jwtSecret) as any;
    ctx.state.admin = decoded;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
  }
}

// Serve admin login page
router.get("/", async (ctx) => {
  const token = ctx.cookies.get('admin_token');
  
  if (token) {
    try {
      jwt.verify(token, WEB_CONFIG.jwtSecret);
      // Redirect to dashboard if already authenticated
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
    <title>Admin Login - Snallabot</title>
    <link rel="stylesheet" href="/styles/admin.css">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="/assets/logo.png" alt="Snallabot" class="login-logo">
                <h1>Admin Portal</h1>
                <p>Sign in to manage your Madden league</p>
            </div>
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary">Sign In</button>
                <div id="error-message" class="error-message"></div>
            </form>
        </div>
    </div>
    <script src="/scripts/admin-login.js"></script>
</body>
</html>
  `;
});

// Admin login endpoint
router.post("/login", async (ctx) => {
  const { email, password } = ctx.request.body as any;

  // Simple authentication - in production, use proper user management
  if (email === WEB_CONFIG.adminEmail && password === WEB_CONFIG.adminPassword) {
    const token = jwt.sign(
      { email, role: 'admin' },
      WEB_CONFIG.jwtSecret,
      { expiresIn: '24h' }
    );

    ctx.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    ctx.body = { success: true, redirect: '/admin/dashboard' };
  } else {
    ctx.status = 401;
    ctx.body = { error: 'Invalid credentials' };
  }
});

// Admin dashboard
router.get("/dashboard", requireAuth, async (ctx) => {
  ctx.type = 'html';
  ctx.body = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Snallabot</title>
    <link rel="stylesheet" href="/styles/admin.css">
</head>
<body>
    <div class="admin-layout">
        <nav class="admin-sidebar">
            <div class="sidebar-header">
                <img src="/assets/logo.png" alt="Snallabot" class="sidebar-logo">
                <span>Admin Portal</span>
            </div>
            <ul class="sidebar-nav">
                <li><a href="#overview" class="nav-link active">Overview</a></li>
                <li><a href="#servers" class="nav-link">Discord Servers</a></li>
                <li><a href="#channels" class="nav-link">Channel Management</a></li>
                <li><a href="#bot-status" class="nav-link">Bot Status</a></li>
                <li><a href="#analytics" class="nav-link">Analytics</a></li>
                <li><a href="#settings" class="nav-link">Settings</a></li>
            </ul>
            <div class="sidebar-footer">
                <button id="logoutBtn" class="btn btn-secondary">Logout</button>
            </div>
        </nav>
        <main class="admin-content">
            <header class="content-header">
                <h1 id="pageTitle">Dashboard Overview</h1>
                <div class="header-actions">
                    <button class="btn btn-primary" id="refreshData">Refresh Data</button>
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

// Get Discord servers
router.get("/api/servers", requireAuth, async (ctx) => {
  try {
    const serversSnapshot = await db.collection("league_settings").get();
    const servers = serversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    ctx.body = servers;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch servers' };
  }
});

// Get server details
router.get("/api/servers/:serverId", requireAuth, async (ctx) => {
  const { serverId } = ctx.params;
  
  try {
    const doc = await db.collection("league_settings").doc(serverId).get();
    if (!doc.exists) {
      ctx.status = 404;
      ctx.body = { error: 'Server not found' };
      return;
    }
    
    ctx.body = { id: doc.id, ...doc.data() };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch server details' };
  }
});

// Update server settings
router.put("/api/servers/:serverId", requireAuth, async (ctx) => {
  const { serverId } = ctx.params;
  const settings = ctx.request.body as Partial<LeagueSettings>;
  
  try {
    await db.collection("league_settings").doc(serverId).set(settings, { merge: true });
    ctx.body = { success: true };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to update server settings' };
  }
});

// Get bot analytics
router.get("/api/analytics", requireAuth, async (ctx) => {
  try {
    // Mock analytics data - in production, implement proper analytics
    const analytics = {
      totalServers: 5,
      totalCommands: 1250,
      activeUsers: 89,
      commandsToday: 45,
      popularCommands: [
        { name: 'standings', count: 234 },
        { name: 'schedule', count: 189 },
        { name: 'player', count: 156 },
        { name: 'teams', count: 134 },
        { name: 'game_channels', count: 98 }
      ],
      serverActivity: [
        { serverId: '123456789', serverName: 'Main League', commandCount: 456 },
        { serverId: '987654321', serverName: 'Secondary League', commandCount: 234 },
        { serverId: '456789123', serverName: 'Test Server', commandCount: 123 }
      ]
    };
    
    ctx.body = analytics;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch analytics' };
  }
});

// Logout endpoint
router.post("/logout", async (ctx) => {
  ctx.cookies.set('admin_token', '', { maxAge: 0 });
  ctx.body = { success: true };
});

export default router;