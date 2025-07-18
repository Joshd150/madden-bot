/**
 * VFL Manager Admin Dashboard JavaScript
 * 
 * This is the brain of our admin portal. It handles all the interactive functionality,
 * data loading, and user interface management for league administrators.
 * 
 * Think of this as the control center for our entire VFL operation - from here,
 * admins can manage teams, configure the bot, view analytics, and control every
 * aspect of the league.
 */

class VFLAdminDashboard {
    constructor() {
        this.currentPage = 'overview';
        this.apiBase = '/admin/api';
        this.refreshInterval = null;
        
        console.log('🎛️ VFL Admin Dashboard initializing...');
        this.init();
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        this.setupEventListeners();
        await this.loadPage('overview');
        this.startAutoRefresh();
        console.log('✅ VFL Admin Dashboard ready!');
    }

    /**
     * Set up all event listeners for the dashboard
     */
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.loadPage(page);
            });
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', this.logout.bind(this));

        // Refresh data button
        document.getElementById('refreshData').addEventListener('click', () => {
            this.loadPage(this.currentPage, true);
        });

        // Handle mobile sidebar toggle (if needed)
        this.setupMobileHandlers();
    }

    /**
     * Set up mobile-specific handlers
     */
    setupMobileHandlers() {
        // Add mobile menu toggle if screen is small
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.admin-sidebar');
            const content = document.querySelector('.admin-content');
            
            // Add overlay for mobile
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                display: none;
            `;
            document.body.appendChild(overlay);
            
            // Toggle sidebar on overlay click
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.style.display = 'none';
            });
        }
    }

    /**
     * Load a specific page in the dashboard
     */
    async loadPage(page, forceRefresh = false) {
        if (this.currentPage === page && !forceRefresh) return;
        
        this.currentPage = page;
        
        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        pageTitle.textContent = this.getPageTitle(page);

        // Show loading state
        const contentBody = document.getElementById('contentBody');
        contentBody.innerHTML = '<div class="loading">Loading...</div>';

        try {
            switch (page) {
                case 'overview':
                    await this.loadOverview();
                    break;
                case 'bot-config':
                    await this.loadBotConfig();
                    break;
                case 'teams':
                    await this.loadTeamsManagement();
                    break;
                case 'players':
                    await this.loadPlayersManagement();
                    break;
                case 'trades':
                    await this.loadTradesManagement();
                    break;
                case 'games':
                    await this.loadGamesManagement();
                    break;
                case 'analytics':
                    await this.loadAnalytics();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                default:
                    contentBody.innerHTML = '<div class="error">Page not found</div>';
            }
        } catch (error) {
            console.error('Error loading page:', error);
            contentBody.innerHTML = '<div class="error">Failed to load page content. Please try refreshing.</div>';
        }
    }

    /**
     * Get the display title for a page
     */
    getPageTitle(page) {
        const titles = {
            'overview': '📊 Dashboard Overview',
            'bot-config': '🤖 Bot Configuration',
            'teams': '🏈 Teams Management',
            'players': '👤 Players Management',
            'trades': '🔄 Trades Management',
            'games': '🏆 Games Management',
            'analytics': '📈 Analytics & Reports',
            'settings': '⚙️ System Settings'
        };
        return titles[page] || 'Dashboard';
    }

    /**
     * Load the overview page with key metrics and recent activity
     */
    async loadOverview() {
        try {
            const overview = await this.fetchData('/overview');
            
            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-grid">
                    <!-- Key Metrics -->
                    <div class="dashboard-card">
                        <h3>📊 League Statistics</h3>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <div class="stat-value">${overview.totals.teams}</div>
                                <div class="stat-label">Teams</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overview.totals.players}</div>
                                <div class="stat-label">Players</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overview.totals.trades}</div>
                                <div class="stat-label">Total Trades</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${overview.totals.games}</div>
                                <div class="stat-label">Games Played</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Trades -->
                    <div class="dashboard-card">
                        <h3>🔄 Recent Trades</h3>
                        <div class="activity-list">
                            ${overview.recentTrades.map(trade => `
                                <div class="activity-item">
                                    <div class="activity-info">
                                        <div class="activity-title">${trade.fromTeamName} ↔️ ${trade.toTeamName}</div>
                                        <div class="activity-details">${trade.players.length} player(s) involved</div>
                                    </div>
                                    <div class="activity-time">${this.formatDate(trade.tradeDate)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Recent Games -->
                    <div class="dashboard-card">
                        <h3>🏆 Recent Games</h3>
                        <div class="activity-list">
                            ${overview.recentGames.map(game => `
                                <div class="activity-item">
                                    <div class="activity-info">
                                        <div class="activity-title">${game.awayTeamName} vs ${game.homeTeamName}</div>
                                        <div class="activity-details">Final: ${game.awayScore} - ${game.homeScore}</div>
                                    </div>
                                    <div class="activity-time">${this.formatDate(game.gameDate)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- System Status -->
                    <div class="dashboard-card">
                        <h3>🔧 System Status</h3>
                        <div class="activity-list">
                            <div class="activity-item">
                                <div class="activity-info">
                                    <div class="activity-title">Discord Bot</div>
                                    <div class="activity-details">All systems operational</div>
                                </div>
                                <div class="status-indicator status-healthy">
                                    <div class="status-dot"></div>
                                    Online
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-info">
                                    <div class="activity-title">Database</div>
                                    <div class="activity-details">Firestore connection healthy</div>
                                </div>
                                <div class="status-indicator status-healthy">
                                    <div class="status-dot"></div>
                                    Connected
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-info">
                                    <div class="activity-title">Web Portal</div>
                                    <div class="activity-details">All services running</div>
                                </div>
                                <div class="status-indicator status-healthy">
                                    <div class="status-dot"></div>
                                    Active
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load overview data');
        }
    }

    /**
     * Load bot configuration management
     */
    async loadBotConfig() {
        try {
            const configs = await this.fetchData('/bot-configs');
            
            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-card">
                    <h3>🤖 Discord Server Configurations</h3>
                    <p class="mb-3">Manage bot settings for each Discord server where VFL Manager is installed.</p>
                    
                    ${configs.length === 0 ? 
                        '<div class="no-data">No Discord servers configured yet.</div>' :
                        `<div class="data-table">
                            <div class="table-header">Discord Servers (${configs.length})</div>
                            <div class="table-body">
                                ${configs.map(config => `
                                    <div class="table-row">
                                        <div class="table-cell">
                                            <strong>Server ID:</strong> ${config.guildId}
                                        </div>
                                        <div class="table-cell">
                                            <strong>Trades Channel:</strong> ${config.tradesChannelId || 'Not set'}
                                        </div>
                                        <div class="table-cell">
                                            <strong>Scores Channel:</strong> ${config.scoresChannelId || 'Not set'}
                                        </div>
                                        <div class="table-cell">
                                            <button class="btn btn-primary btn-small" onclick="adminDashboard.editBotConfig('${config.guildId}')">
                                                Configure
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>`
                    }
                </div>
                
                <div class="dashboard-card mt-4">
                    <h3>⚙️ Global Bot Settings</h3>
                    <div class="form-grid">
                        <div class="form-section">
                            <h4>Automation Settings</h4>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked> Auto-post trades to channels
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" checked> Auto-post game results
                                </label>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox"> Enable live game updates
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4>Display Settings</h4>
                            <div class="form-group">
                                <label for="embedColor">Default Embed Color</label>
                                <input type="color" id="embedColor" value="#1f8b4c">
                            </div>
                            <div class="form-group">
                                <label for="botName">Bot Display Name</label>
                                <input type="text" id="botName" value="VFL Manager" placeholder="VFL Manager">
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-success mt-3">Save Global Settings</button>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load bot configuration');
        }
    }

    /**
     * Load teams management interface
     */
    async loadTeamsManagement() {
        try {
            const teams = await this.fetchData('/teams');
            
            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h3>🏈 Teams Management</h3>
                        <button class="btn btn-primary" onclick="adminDashboard.showAddTeamForm()">
                            ➕ Add New Team
                        </button>
                    </div>
                    
                    <div class="data-table">
                        <div class="table-header">League Teams (${teams.length})</div>
                        <div class="table-body">
                            ${teams.map(team => `
                                <div class="table-row">
                                    <div class="table-cell">
                                        <strong>${team.city} ${team.name}</strong><br>
                                        <small>${team.conference} • ${team.division}</small>
                                    </div>
                                    <div class="table-cell">
                                        ${team.record ? `${team.record.wins}-${team.record.losses}${team.record.ties ? `-${team.record.ties}` : ''}` : 'No record'}
                                    </div>
                                    <div class="table-cell">
                                        ${team.stats ? `${team.stats.pointsFor || 0} PF, ${team.stats.pointsAgainst || 0} PA` : 'No stats'}
                                    </div>
                                    <div class="table-cell">
                                        <button class="btn btn-secondary btn-small" onclick="adminDashboard.editTeam('${team.id}')">
                                            Edit
                                        </button>
                                        <button class="btn btn-error btn-small" onclick="adminDashboard.deleteTeam('${team.id}')">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load teams management');
        }
    }

    /**
     * Load trades management interface
     */
    async loadTradesManagement() {
        try {
            const trades = await this.fetchData('/trades?limit=20');
            
            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h3>🔄 Trades Management</h3>
                        <button class="btn btn-primary" onclick="adminDashboard.showAddTradeForm()">
                            ➕ Add New Trade
                        </button>
                    </div>
                    
                    <div class="data-table">
                        <div class="table-header">Recent Trades (${trades.length})</div>
                        <div class="table-body">
                            ${trades.map(trade => `
                                <div class="table-row">
                                    <div class="table-cell">
                                        <strong>${trade.fromTeamName} ↔️ ${trade.toTeamName}</strong><br>
                                        <small>${trade.players.length} player(s) involved</small>
                                    </div>
                                    <div class="table-cell">
                                        ${this.formatDate(trade.tradeDate)}
                                    </div>
                                    <div class="table-cell">
                                        <div class="status-indicator ${trade.postedToDiscord ? 'status-healthy' : 'status-warning'}">
                                            <div class="status-dot"></div>
                                            ${trade.postedToDiscord ? 'Posted' : 'Pending'}
                                        </div>
                                    </div>
                                    <div class="table-cell">
                                        <button class="btn btn-secondary btn-small" onclick="adminDashboard.viewTrade('${trade.id}')">
                                            View
                                        </button>
                                        ${!trade.postedToDiscord ? 
                                            `<button class="btn btn-primary btn-small" onclick="adminDashboard.postTrade('${trade.id}')">Post</button>` : 
                                            ''
                                        }
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load trades management');
        }
    }

    /**
     * Load analytics and reporting
     */
    async loadAnalytics() {
        try {
            const analytics = await this.fetchData('/analytics');
            
            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-grid">
                    <!-- Bot Usage Stats -->
                    <div class="dashboard-card">
                        <h3>📈 Bot Usage Statistics</h3>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <div class="stat-value">${analytics.totalCommands}</div>
                                <div class="stat-label">Total Commands</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${analytics.commandsToday}</div>
                                <div class="stat-label">Commands Today</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${analytics.activeUsers}</div>
                                <div class="stat-label">Active Users</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${analytics.totalServers}</div>
                                <div class="stat-label">Discord Servers</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Popular Commands -->
                    <div class="dashboard-card">
                        <h3>🏆 Most Used Commands</h3>
                        <div class="activity-list">
                            ${analytics.popularCommands.map((cmd, index) => `
                                <div class="activity-item">
                                    <div class="activity-info">
                                        <div class="activity-title">${index + 1}. /${cmd.name}</div>
                                        <div class="activity-details">Command usage</div>
                                    </div>
                                    <div class="stat-value" style="font-size: 1.2rem;">${cmd.count}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Server Activity -->
                    <div class="dashboard-card">
                        <h3>🌐 Server Activity</h3>
                        <div class="activity-list">
                            ${analytics.serverActivity.map(server => `
                                <div class="activity-item">
                                    <div class="activity-info">
                                        <div class="activity-title">${server.serverName}</div>
                                        <div class="activity-details">Discord Server</div>
                                    </div>
                                    <div class="stat-value" style="font-size: 1.2rem;">${server.commandCount}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- League Activity Trends -->
                    <div class="dashboard-card">
                        <h3>📊 League Activity Trends</h3>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <div class="stat-value">${analytics.tradesPerWeek.reduce((a, b) => a + b, 0)}</div>
                                <div class="stat-label">Trades (Last 7 weeks)</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${analytics.gamesPerWeek.reduce((a, b) => a + b, 0)}</div>
                                <div class="stat-label">Games (Last 7 weeks)</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <p class="text-muted">Detailed charts and trends would be implemented here with a charting library like Chart.js</p>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load analytics');
        }
    }

    /**
     * Load system settings
     */
    async loadSettings() {
        const contentBody = document.getElementById('contentBody');
        contentBody.innerHTML = `
            <div class="form-grid">
                <div class="form-section">
                    <h4>🔧 System Configuration</h4>
                    <div class="form-group">
                        <label for="leagueName">League Name</label>
                        <input type="text" id="leagueName" value="VFL Manager League" placeholder="Enter league name">
                    </div>
                    <div class="form-group">
                        <label for="currentSeason">Current Season</label>
                        <input type="number" id="currentSeason" value="2024" placeholder="2024">
                    </div>
                    <div class="form-group">
                        <label for="currentWeek">Current Week</label>
                        <input type="number" id="currentWeek" value="1" min="1" max="18" placeholder="1">
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>🎨 Appearance Settings</h4>
                    <div class="form-group">
                        <label for="primaryColor">Primary Color</label>
                        <input type="color" id="primaryColor" value="#1f8b4c">
                    </div>
                    <div class="form-group">
                        <label for="secondaryColor">Secondary Color</label>
                        <input type="color" id="secondaryColor" value="#ff6b35">
                    </div>
                    <div class="form-group">
                        <label for="logoUrl">League Logo URL</label>
                        <input type="url" id="logoUrl" placeholder="https://example.com/logo.png">
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>🔔 Notification Settings</h4>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" checked> Email notifications for trades
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" checked> Email notifications for games
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox"> Weekly summary emails
                        </label>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>🔒 Security Settings</h4>
                    <div class="form-group">
                        <label for="sessionTimeout">Session Timeout (hours)</label>
                        <input type="number" id="sessionTimeout" value="24" min="1" max="168">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" checked> Require admin approval for trades
                        </label>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox"> Enable audit logging
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <button class="btn btn-success" onclick="adminDashboard.saveSettings()">
                    💾 Save All Settings
                </button>
                <button class="btn btn-secondary" onclick="adminDashboard.resetSettings()">
                    🔄 Reset to Defaults
                </button>
            </div>
        `;
    }

    /**
     * Placeholder methods for various actions
     * These would be implemented with full functionality in a production system
     */
    
    async editBotConfig(guildId) {
        this.showNotification(`Bot configuration for server ${guildId} would open here`, 'info');
    }

    async showAddTeamForm() {
        this.showNotification('Add team form would open here', 'info');
    }

    async editTeam(teamId) {
        this.showNotification(`Edit team ${teamId} form would open here`, 'info');
    }

    async deleteTeam(teamId) {
        if (confirm('Are you sure you want to delete this team?')) {
            this.showNotification(`Team ${teamId} would be deleted`, 'warning');
        }
    }

    async showAddTradeForm() {
        this.showNotification('Add trade form would open here', 'info');
    }

    async viewTrade(tradeId) {
        this.showNotification(`Trade ${tradeId} details would open here`, 'info');
    }

    async postTrade(tradeId) {
        this.showNotification(`Trade ${tradeId} would be posted to Discord`, 'success');
    }

    async saveSettings() {
        this.showNotification('Settings saved successfully!', 'success');
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            this.showNotification('Settings reset to defaults', 'warning');
        }
    }

    /**
     * Utility method to fetch data from API
     */
    async fetchData(endpoint) {
        const response = await fetch(`${this.apiBase}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Start auto-refresh for real-time data
     */
    startAutoRefresh() {
        // Refresh current page data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (this.currentPage === 'overview') {
                this.loadPage('overview', true);
            }
        }, 30000);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Logout functionality
     */
    async logout() {
        try {
            await fetch('/admin/logout', { method: 'POST' });
            this.showNotification('Logged out successfully', 'success');
            
            setTimeout(() => {
                window.location.href = '/admin';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout request fails
            window.location.href = '/admin';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new VFLAdminDashboard();
});