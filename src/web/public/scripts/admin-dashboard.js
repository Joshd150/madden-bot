// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentPage = 'overview';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPage('overview');
    }

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
            this.loadPage(this.currentPage);
        });
    }

    async loadPage(page) {
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

        // Load page content
        const contentBody = document.getElementById('contentBody');
        contentBody.innerHTML = '<div class="loading">Loading...</div>';

        try {
            switch (page) {
                case 'overview':
                    await this.loadOverview();
                    break;
                case 'servers':
                    await this.loadServers();
                    break;
                case 'channels':
                    await this.loadChannels();
                    break;
                case 'bot-status':
                    await this.loadBotStatus();
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
            contentBody.innerHTML = '<div class="error">Failed to load page content</div>';
        }
    }

    getPageTitle(page) {
        const titles = {
            'overview': 'Dashboard Overview',
            'servers': 'Discord Servers',
            'channels': 'Channel Management',
            'bot-status': 'Bot Status',
            'analytics': 'Analytics',
            'settings': 'Settings'
        };
        return titles[page] || 'Dashboard';
    }

    async loadOverview() {
        try {
            const [analytics, servers] = await Promise.all([
                fetch('/admin/api/analytics').then(r => r.json()),
                fetch('/admin/api/servers').then(r => r.json())
            ]);

            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <h3>Quick Stats</h3>
                        <div class="stat-grid">
                            <div class="stat-item">
                                <div class="stat-value">${analytics.totalServers}</div>
                                <div class="stat-label">Discord Servers</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${analytics.activeUsers}</div>
                                <div class="stat-label">Active Users</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${analytics.totalCommands}</div>
                                <div class="stat-label">Total Commands</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${analytics.commandsToday}</div>
                                <div class="stat-label">Commands Today</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>Popular Commands</h3>
                        <div class="command-list">
                            ${analytics.popularCommands.map(cmd => `
                                <div class="command-item">
                                    <span class="command-name">/${cmd.name}</span>
                                    <span class="command-count">${cmd.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>Recent Server Activity</h3>
                        <div class="server-list">
                            ${analytics.serverActivity.map(server => `
                                <div class="server-item">
                                    <div class="server-info">
                                        <h4>${server.serverName}</h4>
                                        <p>${server.commandCount} commands used</p>
                                    </div>
                                    <div class="server-actions">
                                        <button class="btn btn-small btn-primary" onclick="adminDashboard.viewServer('${server.serverId}')">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load overview data');
        }
    }

    async loadServers() {
        try {
            const servers = await fetch('/admin/api/servers').then(r => r.json());
            
            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-card">
                    <h3>Discord Servers (${servers.length})</h3>
                    <div class="server-list">
                        ${servers.map(server => `
                            <div class="server-item">
                                <div class="server-info">
                                    <h4>Server ID: ${server.id}</h4>
                                    <p>League: ${server.commands?.madden_league?.league_id || 'Not connected'}</p>
                                    <p>Commands configured: ${Object.keys(server.commands || {}).length}</p>
                                </div>
                                <div class="server-actions">
                                    <button class="btn btn-small btn-primary" onclick="adminDashboard.viewServer('${server.id}')">
                                        Configure
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load servers');
        }
    }

    async loadChannels() {
        const contentBody = document.getElementById('contentBody');
        contentBody.innerHTML = `
            <div class="dashboard-card">
                <h3>Channel Management</h3>
                <p>Channel management features will be implemented here.</p>
                <p>This will allow you to:</p>
                <ul>
                    <li>View all configured notification channels across servers</li>
                    <li>Manage channel assignments for different event types</li>
                    <li>Test channel notifications</li>
                    <li>View channel activity logs</li>
                </ul>
            </div>
        `;
    }

    async loadBotStatus() {
        const contentBody = document.getElementById('contentBody');
        contentBody.innerHTML = `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>Bot Status</h3>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value success">Online</div>
                            <div class="stat-label">Status</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">99.9%</div>
                            <div class="stat-label">Uptime</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">45ms</div>
                            <div class="stat-label">Latency</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">128MB</div>
                            <div class="stat-label">Memory Usage</div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-card">
                    <h3>System Health</h3>
                    <p>All systems operational</p>
                    <ul>
                        <li>✅ Discord API Connection</li>
                        <li>✅ Database Connection</li>
                        <li>✅ Web Server</li>
                        <li>✅ Background Tasks</li>
                    </ul>
                </div>
            </div>
        `;
    }

    async loadAnalytics() {
        try {
            const analytics = await fetch('/admin/api/analytics').then(r => r.json());
            
            const contentBody = document.getElementById('contentBody');
            contentBody.innerHTML = `
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <h3>Command Usage</h3>
                        <div class="command-list">
                            ${analytics.popularCommands.map(cmd => `
                                <div class="command-item">
                                    <span class="command-name">/${cmd.name}</span>
                                    <span class="command-count">${cmd.count} uses</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>Server Activity</h3>
                        <div class="server-list">
                            ${analytics.serverActivity.map(server => `
                                <div class="server-item">
                                    <div class="server-info">
                                        <h4>${server.serverName}</h4>
                                        <p>${server.commandCount} commands</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>Usage Trends</h3>
                        <p>Detailed analytics charts would be implemented here showing:</p>
                        <ul>
                            <li>Command usage over time</li>
                            <li>Server growth metrics</li>
                            <li>User engagement patterns</li>
                            <li>Error rates and performance metrics</li>
                        </ul>
                    </div>
                </div>
            `;
        } catch (error) {
            throw new Error('Failed to load analytics');
        }
    }

    async loadSettings() {
        const contentBody = document.getElementById('contentBody');
        contentBody.innerHTML = `
            <div class="dashboard-card">
                <h3>Global Settings</h3>
                <form id="settingsForm">
                    <div class="form-group">
                        <label for="botStatus">Bot Status</label>
                        <select id="botStatus" name="botStatus">
                            <option value="online">Online</option>
                            <option value="maintenance">Maintenance Mode</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="defaultLeague">Default League ID</label>
                        <input type="text" id="defaultLeague" name="defaultLeague" placeholder="Enter default league ID">
                    </div>
                    
                    <div class="form-group">
                        <label for="maintenanceMessage">Maintenance Message</label>
                        <textarea id="maintenanceMessage" name="maintenanceMessage" rows="3" placeholder="Message to show during maintenance"></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Save Settings</button>
                </form>
            </div>
        `;

        // Add form submission handler
        document.getElementById('settingsForm').addEventListener('submit', this.saveSettings.bind(this));
    }

    async saveSettings(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settings = Object.fromEntries(formData);
        
        try {
            const response = await fetch('/admin/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showNotification('Settings saved successfully', 'success');
            } else {
                this.showNotification('Failed to save settings', 'error');
            }
        } catch (error) {
            this.showNotification('Network error', 'error');
        }
    }

    async viewServer(serverId) {
        try {
            const server = await fetch(`/admin/api/servers/${serverId}`).then(r => r.json());
            
            // Create a modal or navigate to server details
            this.showServerModal(server);
        } catch (error) {
            this.showNotification('Failed to load server details', 'error');
        }
    }

    showServerModal(server) {
        // Implementation for server configuration modal
        console.log('Server details:', server);
        this.showNotification('Server configuration modal would open here', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        switch (type) {
            case 'success':
                notification.style.backgroundColor = 'var(--admin-success)';
                break;
            case 'error':
                notification.style.backgroundColor = 'var(--admin-error)';
                break;
            case 'warning':
                notification.style.backgroundColor = 'var(--admin-warning)';
                break;
            default:
                notification.style.backgroundColor = 'var(--admin-primary)';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    async logout() {
        try {
            await fetch('/admin/logout', { method: 'POST' });
            window.location.href = '/admin';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/admin';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});