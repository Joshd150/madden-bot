// Main JavaScript for Snallabot League Website
class SnallabotWebsite {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.startDataRefresh();
    }

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
                }
            });
        });

        // Intersection Observer for animations
        this.setupScrollAnimations();
    }

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

        // Observe all sections
        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section);
        });
    }

    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('mobile-open');
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadHeroStats(),
                this.loadStandings(),
                this.loadStatistics(),
                this.loadTeams()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load league data. Please refresh the page.');
        }
    }

    async loadHeroStats() {
        try {
            const response = await fetch(`${this.apiBase}/league/stats/summary`);
            if (!response.ok) throw new Error('Failed to fetch hero stats');
            
            const data = await response.json();
            
            this.animateCounter('totalGames', data.totalGames || 0);
            this.animateCounter('activeTeams', data.activeTeams || 32);
            this.animateCounter('currentWeek', data.currentWeek || 1);
        } catch (error) {
            console.error('Error loading hero stats:', error);
            // Set default values
            this.animateCounter('totalGames', 0);
            this.animateCounter('activeTeams', 32);
            this.animateCounter('currentWeek', 1);
        }
    }

    async loadStandings() {
        try {
            const response = await fetch(`${this.apiBase}/league/standings`);
            if (!response.ok) throw new Error('Failed to fetch standings');
            
            const standings = await response.json();
            
            const afcTeams = standings.filter(team => team.conferenceName.toLowerCase() === 'afc');
            const nfcTeams = standings.filter(team => team.conferenceName.toLowerCase() === 'nfc');
            
            this.renderStandings('afcStandings', afcTeams);
            this.renderStandings('nfcStandings', nfcTeams);
        } catch (error) {
            console.error('Error loading standings:', error);
            this.showLoadingError('afcStandings', 'Failed to load AFC standings');
            this.showLoadingError('nfcStandings', 'Failed to load NFC standings');
        }
    }

    async loadStatistics() {
        try {
            const [passing, rushing, receiving, defensive] = await Promise.all([
                fetch(`${this.apiBase}/league/leaders/passing`).then(r => r.json()),
                fetch(`${this.apiBase}/league/leaders/rushing`).then(r => r.json()),
                fetch(`${this.apiBase}/league/leaders/receiving`).then(r => r.json()),
                fetch(`${this.apiBase}/league/leaders/defensive`).then(r => r.json())
            ]);

            this.renderStatLeaders('passingLeaders', passing, 'passingYards');
            this.renderStatLeaders('rushingLeaders', rushing, 'rushingYards');
            this.renderStatLeaders('receivingLeaders', receiving, 'receivingYards');
            this.renderStatLeaders('defensiveLeaders', defensive, 'tackles');
        } catch (error) {
            console.error('Error loading statistics:', error);
            ['passingLeaders', 'rushingLeaders', 'receivingLeaders', 'defensiveLeaders'].forEach(id => {
                this.showLoadingError(id, 'Failed to load statistics');
            });
        }
    }

    async loadTeams() {
        try {
            const response = await fetch(`${this.apiBase}/league/teams`);
            if (!response.ok) throw new Error('Failed to fetch teams');
            
            const teams = await response.json();
            this.renderTeams(teams);
        } catch (error) {
            console.error('Error loading teams:', error);
            this.showLoadingError('teamsGrid', 'Failed to load teams');
        }
    }

    renderStandings(containerId, teams) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const sortedTeams = teams.sort((a, b) => {
            // Sort by wins, then by win percentage, then by points for
            if (a.totalWins !== b.totalWins) return b.totalWins - a.totalWins;
            if (a.winPct !== b.winPct) return b.winPct - a.winPct;
            return b.ptsFor - a.ptsFor;
        });

        const html = sortedTeams.slice(0, 8).map((team, index) => `
            <div class="team-row slide-in-left" style="animation-delay: ${index * 0.1}s">
                <div class="team-rank">${index + 1}</div>
                <div class="team-info">
                    <div class="team-name">${team.teamName}</div>
                </div>
                <div class="team-record">${this.formatRecord(team)}</div>
                <div class="team-points">PF: ${team.ptsFor}</div>
                <div class="team-points">PA: ${team.ptsAgainst}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderStatLeaders(containerId, players, statKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = players.slice(0, 5).map((player, index) => `
            <div class="stat-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="player-info">
                    <div class="player-name">${player.firstName} ${player.lastName}</div>
                    <div class="player-team">${player.teamName} • ${player.position}</div>
                </div>
                <div class="stat-value">${this.formatStatValue(player[statKey] || 0, statKey)}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderTeams(teams) {
        const container = document.getElementById('teamsGrid');
        if (!container) return;

        const html = teams.map((team, index) => `
            <div class="team-card fade-in" style="animation-delay: ${index * 0.05}s">
                <div class="team-header">
                    <div class="team-name-large">${team.displayName}</div>
                    <div class="team-record-large">${this.formatRecord(team)}</div>
                </div>
                <div class="team-body">
                    <div class="team-stats">
                        <div class="team-stat">
                            <div class="team-stat-value">${team.ovrRating}</div>
                            <div class="team-stat-label">Overall</div>
                        </div>
                        <div class="team-stat">
                            <div class="team-stat-value">${team.injuryCount}</div>
                            <div class="team-stat-label">Injuries</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    formatRecord(team) {
        if (team.totalTies && team.totalTies > 0) {
            return `${team.totalWins}-${team.totalLosses}-${team.totalTies}`;
        }
        return `${team.totalWins}-${team.totalLosses}`;
    }

    formatStatValue(value, statType) {
        switch (statType) {
            case 'passingYards':
            case 'rushingYards':
            case 'receivingYards':
                return `${value.toLocaleString()} yds`;
            case 'tackles':
                return `${value} tackles`;
            case 'sacks':
                return `${value} sacks`;
            case 'interceptions':
                return `${value} INTs`;
            default:
                return value.toLocaleString();
        }
    }

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

    showLoadingError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="loading error">${message}</div>`;
        }
    }

    showError(message) {
        // Create a toast notification or modal
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ed4245;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    startDataRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadInitialData();
        }, 5 * 60 * 1000);
    }
}

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SnallabotWebsite();
});

// Service Worker Registration for PWA capabilities
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