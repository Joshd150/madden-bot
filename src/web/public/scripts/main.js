/**
 * VFL Manager Website JavaScript - The brain of our web interface!
 * 
 * This script handles all the interactive functionality of our website. It fetches
 * data from our API endpoints (which connect to the same Firestore database as our
 * Discord bot), manages the user interface, and provides a smooth, responsive
 * experience for our users.
 * 
 * Think of this as the conductor of our web orchestra - it coordinates all the
 * different parts to create a harmonious user experience.
 */

class VFLManagerWebsite {
    constructor() {
        // Our API base URL - this connects to the same backend as our Discord bot
        this.apiBase = '/api/vfl';
        
        // Track the current active tabs for different sections
        this.activeConference = 'all';
        this.activeStatCategory = 'passing';
        this.activeWeek = 'current';
        this.activeScheduleView = 'upcoming';
        
        // Initialize everything when the page loads
        this.init();
    }

    /**
     * Initialize the website - set up event listeners and load initial data
     * This is like starting up our sports center for the day!
     */
    async init() {
        console.log('🏈 Initializing VFL Manager Website...');
        
        // Set up all our interactive elements
        this.setupEventListeners();
        
        // Load all the data that makes our site come alive
        await this.loadInitialData();
        
        // Start refreshing data periodically to keep everything current
        this.startDataRefresh();
        
        // Set up scroll animations for a polished feel
        this.setupScrollAnimations();
        
        console.log('✅ VFL Manager Website initialized successfully!');
    }

    /**
     * Set up all the event listeners for interactive elements
     * This makes buttons clickable, tabs switchable, and modals modal-y
     */
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update active nav link
                    this.updateActiveNavLink(anchor.getAttribute('href'));
                }
            });
        });

        // Conference tabs for teams section
        document.querySelectorAll('[data-conference]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const conference = e.target.dataset.conference;
                this.switchConference(conference);
            });
        });

        // Statistics tabs
        document.querySelectorAll('[data-stat]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const statCategory = e.target.dataset.stat;
                this.switchStatCategory(statCategory);
            });
        });

        // Week selector for schedule
        const weekSelect = document.getElementById('weekSelect');
        if (weekSelect) {
            weekSelect.addEventListener('change', (e) => {
                this.activeWeek = e.target.value;
                this.loadSchedule();
            });
        }

        // Schedule view toggle (upcoming vs completed)
        document.querySelectorAll('[data-view]').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchScheduleView(view);
            });
        });

        // Discord join modal
        const joinButtons = document.querySelectorAll('#joinDiscordBtn, #joinDiscordBtn2');
        const modal = document.getElementById('discordModal');
        const closeModal = document.querySelector('.close');
        const closeModalBtn = document.getElementById('closeModal');

        joinButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'block';
            });
        });

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Set up scroll animations for a polished, professional feel
     * Elements fade in as they come into view - very satisfying!
     */
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe all sections and cards for animation
        document.querySelectorAll('.section, .team-card, .news-card, .game-card').forEach(element => {
            observer.observe(element);
        });
    }

    /**
     * Load all the initial data that makes our website informative and engaging
     * This is like opening day - we want everything to be perfect!
     */
    async loadInitialData() {
        try {
            console.log('📊 Loading initial data...');
            
            // Load everything in parallel for speed
            await Promise.all([
                this.loadHeroStats(),
                this.loadNews(),
                this.loadRecentTrades(),
                this.loadRecentScores(),
                this.loadTeams(),
                this.loadStatistics(),
                this.loadSchedule()
            ]);
            
            console.log('✅ All initial data loaded successfully!');
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.showError('Failed to load some data. Please refresh the page to try again.');
        }
    }

    /**
     * Load the hero section statistics
     * These are the big numbers that immediately show how active our league is
     */
    async loadHeroStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats/summary`);
            if (!response.ok) throw new Error('Failed to fetch hero stats');
            
            const data = await response.json();
            
            // Animate the counters for a nice effect
            this.animateCounter('totalTrades', data.totalTrades || 0);
            this.animateCounter('activeTeams', data.activeTeams || 32);
            this.animateCounter('currentWeek', data.currentWeek || 1);
            
        } catch (error) {
            console.error('Error loading hero stats:', error);
            // Set some default values so the page doesn't look broken
            this.animateCounter('totalTrades', 0);
            this.animateCounter('activeTeams', 32);
            this.animateCounter('currentWeek', 1);
        }
    }

    /**
     * Load the latest news and updates
     * This keeps our community informed about what's happening in the league
     */
    async loadNews() {
        try {
            const response = await fetch(`${this.apiBase}/news/recent`);
            if (!response.ok) throw new Error('Failed to fetch news');
            
            const news = await response.json();
            this.renderNews(news);
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.showLoadingError('newsGrid', 'Failed to load news updates');
        }
    }

    /**
     * Load recent trades for the news section
     * Everyone loves to see the latest wheeling and dealing!
     */
    async loadRecentTrades() {
        try {
            const response = await fetch(`${this.apiBase}/trades/recent?limit=5`);
            if (!response.ok) throw new Error('Failed to fetch recent trades');
            
            const trades = await response.json();
            this.renderRecentTrades(trades);
            
        } catch (error) {
            console.error('Error loading recent trades:', error);
            this.showLoadingError('recentTrades', 'Failed to load recent trades');
        }
    }

    /**
     * Load recent game scores
     * Sports fans always want to know the latest results!
     */
    async loadRecentScores() {
        try {
            const response = await fetch(`${this.apiBase}/games/recent?limit=5`);
            if (!response.ok) throw new Error('Failed to fetch recent scores');
            
            const games = await response.json();
            this.renderRecentScores(games);
            
        } catch (error) {
            console.error('Error loading recent scores:', error);
            this.showLoadingError('recentScores', 'Failed to load recent scores');
        }
    }

    /**
     * Load all teams in the league
     * This populates our teams section with all the squads
     */
    async loadTeams() {
        try {
            const response = await fetch(`${this.apiBase}/teams`);
            if (!response.ok) throw new Error('Failed to fetch teams');
            
            const teams = await response.json();
            this.allTeams = teams; // Store for filtering
            this.renderTeams(teams);
            
        } catch (error) {
            console.error('Error loading teams:', error);
            this.showLoadingError('teamsGrid', 'Failed to load teams');
        }
    }

    /**
     * Load statistical leaders
     * The stat nerds (and we love them) want to see who's dominating
     */
    async loadStatistics() {
        try {
            const response = await fetch(`${this.apiBase}/stats/leaders/${this.activeStatCategory}`);
            if (!response.ok) throw new Error('Failed to fetch statistics');
            
            const stats = await response.json();
            this.renderStatistics(stats);
            
            // Also load team rankings
            const rankingsResponse = await fetch(`${this.apiBase}/teams/rankings`);
            if (rankingsResponse.ok) {
                const rankings = await rankingsResponse.json();
                this.renderTeamRankings(rankings);
            }
            
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.showLoadingError('statsList', 'Failed to load statistics');
        }
    }

    /**
     * Load the game schedule
     * Essential for planning your viewing schedule!
     */
    async loadSchedule() {
        try {
            let url = `${this.apiBase}/games/schedule?view=${this.activeScheduleView}`;
            if (this.activeWeek !== 'current') {
                url += `&week=${this.activeWeek}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch schedule');
            
            const games = await response.json();
            this.renderSchedule(games);
            
        } catch (error) {
            console.error('Error loading schedule:', error);
            this.showLoadingError('scheduleGrid', 'Failed to load schedule');
        }
    }

    /**
     * Render news articles in a beautiful grid layout
     */
    renderNews(news) {
        const container = document.getElementById('newsGrid');
        if (!container) return;

        if (news.length === 0) {
            container.innerHTML = '<div class="no-data">No recent news available.</div>';
            return;
        }

        const html = news.map((article, index) => `
            <div class="news-card fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="news-header">
                    <h3 class="news-title">${article.title}</h3>
                    <div class="news-date">${new Date(article.publishDate).toLocaleDateString()}</div>
                </div>
                <div class="news-content">
                    <p class="news-excerpt">${article.excerpt || article.content.substring(0, 150) + '...'}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Render recent trades with beautiful formatting
     */
    renderRecentTrades(trades) {
        const container = document.getElementById('recentTrades');
        if (!container) return;

        if (trades.length === 0) {
            container.innerHTML = '<div class="no-data">No recent trades to display.</div>';
            return;
        }

        const html = trades.map((trade, index) => `
            <div class="trade-item slide-in-left" style="animation-delay: ${index * 0.1}s">
                <div class="trade-header">
                    <div class="trade-teams">${trade.fromTeamName} ↔️ ${trade.toTeamName}</div>
                    <div class="trade-date">${new Date(trade.tradeDate).toLocaleDateString()}</div>
                </div>
                <div class="trade-players">
                    ${trade.players.map(player => `${player.name} (${player.position})`).join(', ')}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Render recent game scores with winner highlighting
     */
    renderRecentScores(games) {
        const container = document.getElementById('recentScores');
        if (!container) return;

        if (games.length === 0) {
            container.innerHTML = '<div class="no-data">No recent games to display.</div>';
            return;
        }

        const html = games.map((game, index) => {
            const winner = game.homeScore > game.awayScore ? game.homeTeamName :
                          game.awayScore > game.homeScore ? game.awayTeamName : null;
            
            return `
                <div class="score-item slide-in-right" style="animation-delay: ${index * 0.1}s">
                    <div class="score-header">
                        <div class="score-teams">
                            ${game.awayTeamName} @ ${game.homeTeamName}
                        </div>
                        <div class="score-date">${new Date(game.gameDate).toLocaleDateString()}</div>
                    </div>
                    <div class="score-result">
                        ${game.awayScore} - ${game.homeScore}
                        ${winner ? `<span style="color: var(--success-color)"> (${winner} wins)</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render teams with filtering by conference
     */
    renderTeams(teams) {
        const container = document.getElementById('teamsGrid');
        if (!container) return;

        // Filter teams based on active conference
        let filteredTeams = teams;
        if (this.activeConference !== 'all') {
            filteredTeams = teams.filter(team => team.conference === this.activeConference);
        }

        if (filteredTeams.length === 0) {
            container.innerHTML = '<div class="no-data">No teams found for the selected conference.</div>';
            return;
        }

        const html = filteredTeams.map((team, index) => `
            <div class="team-card fade-in" style="animation-delay: ${index * 0.05}s">
                <div class="team-header">
                    ${team.logoUrl ? `<img src="${team.logoUrl}" alt="${team.name}" class="team-logo-large">` : ''}
                    <div class="team-name-large">${team.city} ${team.name}</div>
                    <div class="team-record-large">
                        ${team.record ? `${team.record.wins}-${team.record.losses}${team.record.ties ? `-${team.record.ties}` : ''}` : 'No record'}
                    </div>
                </div>
                <div class="team-body">
                    <div class="team-stats">
                        <div class="team-stat">
                            <div class="team-stat-value">${team.stats?.pointsFor || 0}</div>
                            <div class="team-stat-label">Points For</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">${team.stats?.pointsAgainst || 0}</div>
                            <div class="team-stat-label">Points Against</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Render statistical leaders for the selected category
     */
    renderStatistics(stats) {
        const container = document.getElementById('statsList');
        const titleElement = document.getElementById('statsTitle');
        
        if (!container) return;

        // Update the title based on the category
        const titles = {
            passing: 'Passing Leaders',
            rushing: 'Rushing Leaders',
            receiving: 'Receiving Leaders',
            defense: 'Defensive Leaders'
        };
        
        if (titleElement) {
            titleElement.textContent = titles[this.activeStatCategory] || 'Statistical Leaders';
        }

        if (stats.length === 0) {
            container.innerHTML = '<div class="no-data">No statistics available for this category.</div>';
            return;
        }

        const html = stats.slice(0, 10).map((player, index) => `
            <div class="stat-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${player.teamName} • ${player.position}</div>
                </div>
                <div class="stat-value">${this.formatStatValue(player.statValue, this.activeStatCategory)}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Render team rankings
     */
    renderTeamRankings(rankings) {
        const container = document.getElementById('teamRankings');
        if (!container) return;

        const html = rankings.slice(0, 8).map((team, index) => `
            <div class="stat-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="player-info">
                    <div class="player-name">${team.name}</div>
                    <div class="player-team">${team.conference} • ${team.division}</div>
                </div>
                <div class="stat-value">${team.record.wins}-${team.record.losses}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Render the game schedule
     */
    renderSchedule(games) {
        const container = document.getElementById('scheduleGrid');
        if (!container) return;

        if (games.length === 0) {
            const message = this.activeScheduleView === 'upcoming' ? 'No upcoming games scheduled.' : 'No completed games found.';
            container.innerHTML = `<div class="no-data">${message}</div>`;
            return;
        }

        const html = games.map((game, index) => {
            const gameDate = new Date(game.gameDate);
            const isCompleted = game.status === 'completed';
            
            return `
                <div class="game-card fade-in" style="animation-delay: ${index * 0.05}s">
                    <div class="game-header">
                        <div class="game-week">Week ${game.week}</div>
                        <div class="game-date">${gameDate.toLocaleDateString()} ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div class="game-body">
                        <div class="game-matchup">
                            <div class="team-info">
                                ${game.awayTeamLogo ? `<img src="${game.awayTeamLogo}" alt="${game.awayTeamName}" class="team-logo-small">` : ''}
                                <div class="team-name">${game.awayTeamName}</div>
                            </div>
                            <div class="game-score">
                                ${isCompleted ? `${game.awayScore} - ${game.homeScore}` : '<span class="game-vs">@</span>'}
                            </div>
                            <div class="team-info">
                                ${game.homeTeamLogo ? `<img src="${game.homeTeamLogo}" alt="${game.homeTeamName}" class="team-logo-small">` : ''}
                                <div class="team-name">${game.homeTeamName}</div>
                            </div>
                        </div>
                        <div class="game-status status-${game.status}">
                            ${this.getStatusText(game.status)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Switch between conferences in the teams section
     */
    switchConference(conference) {
        this.activeConference = conference;
        
        // Update active tab
        document.querySelectorAll('[data-conference]').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-conference="${conference}"]`).classList.add('active');
        
        // Re-render teams with new filter
        if (this.allTeams) {
            this.renderTeams(this.allTeams);
        }
    }

    /**
     * Switch between statistical categories
     */
    switchStatCategory(category) {
        this.activeStatCategory = category;
        
        // Update active tab
        document.querySelectorAll('[data-stat]').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-stat="${category}"]`).classList.add('active');
        
        // Load new statistics
        this.loadStatistics();
    }

    /**
     * Switch between upcoming and completed games
     */
    switchScheduleView(view) {
        this.activeScheduleView = view;
        
        // Update active toggle
        document.querySelectorAll('[data-view]').forEach(toggle => {
            toggle.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Reload schedule
        this.loadSchedule();
    }

    /**
     * Update the active navigation link
     */
    updateActiveNavLink(href) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`a[href="${href}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('mobile-open');
    }

    /**
     * Format statistical values for display
     */
    formatStatValue(value, category) {
        switch (category) {
            case 'passing':
                return `${value.toLocaleString()} yds`;
            case 'rushing':
                return `${value.toLocaleString()} yds`;
            case 'receiving':
                return `${value.toLocaleString()} yds`;
            case 'defense':
                return `${value} tackles`;
            default:
                return value.toLocaleString();
        }
    }

    /**
     * Get human-readable status text
     */
    getStatusText(status) {
        switch (status) {
            case 'scheduled':
                return 'Scheduled';
            case 'in_progress':
                return 'LIVE';
            case 'completed':
                return 'Final';
            default:
                return 'Unknown';
        }
    }

    /**
     * Animate counters for a nice visual effect
     */
    animateCounter(elementId, targetValue, duration = 2000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const increment = targetValue / (duration / 16);
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue).toLocaleString();
        }, 16);
    }

    /**
     * Show loading error in a container
     */
    showLoadingError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="loading error">${message}</div>`;
        }
    }

    /**
     * Show a general error message
     */
    showError(message) {
        // Create a toast notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: var(--border-radius);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: var(--shadow);
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * Start periodic data refresh to keep everything current
     * This ensures our data stays fresh without requiring page refreshes
     */
    startDataRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            console.log('🔄 Refreshing data...');
            this.loadInitialData();
        }, 5 * 60 * 1000);
        
        // Refresh hero stats more frequently (every 2 minutes)
        setInterval(() => {
            this.loadHeroStats();
        }, 2 * 60 * 1000);
    }
}

// Initialize the website when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 VFL Manager Website starting up...');
    new VFLManagerWebsite();
});

// Service Worker Registration for PWA capabilities (optional but nice to have)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}