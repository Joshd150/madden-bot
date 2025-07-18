# VFL Manager - Enhanced Sports Trading & Statistics Bot

Comprehensive sports trading and statistics Discord bot with web portal, built on top of the robust Snallabot foundation.

```
Live Deployment: https://vfl-manager.com
```

## 🏈 What is VFL Manager?

VFL Manager is a comprehensive enhancement to the existing Snallabot system that adds:

- **Automated Trades Channel**: Real-time trade posting with beautiful embeds
- **Automated Scores Channel**: Game results posted automatically with detailed breakdowns
- **Rich Discord Commands**: Professional embeds with team logos and comprehensive statistics
- **Public Website**: Multi-page site showcasing league data, teams, and statistics
- **Admin Portal**: Complete web-based management interface for league administration
- **Advanced Analytics**: Detailed performance metrics and league insights

## ✨ Key Features

### Discord Bot Enhancements
- **Professional Embeds**: All responses use rich, branded embeds with team colors and logos
- **Interactive Components**: Buttons and select menus for enhanced user experience
- **New Commands**:
  - `/vfl-trades` - View recent trades, search by team/player, add new trades
  - `/vfl-scores` - Game scores, schedules, and detailed breakdowns
  - `/vfl-teams` - Team information, rosters, and statistics
- **Automated Posting**: Trades and scores automatically posted to designated channels

### Public Website
- **Landing Page**: Professional homepage with Discord server join functionality
- **News & Updates**: Latest league news, recent trades, and game results
- **Teams Section**: Complete team profiles with statistics and rosters
- **Statistics Hub**: League leaders, player stats, and performance metrics
- **Schedule Center**: Upcoming games and completed results
- **Responsive Design**: Mobile-friendly interface with smooth animations

### Admin Portal
- **Dashboard Overview**: Key metrics, recent activity, and system status
- **Bot Configuration**: Manage Discord server settings and channel assignments
- **Teams Management**: Add, edit, and manage team information
- **Trades Management**: View, add, and manage trade records
- **Analytics**: Comprehensive usage statistics and performance metrics
- **System Settings**: Global configuration and appearance customization

## 🚀 Quick Start

### Prerequisites
- Existing Snallabot installation with Firestore database
- Node.js 18.x or higher
- Discord bot token and application ID
- Domain with Cloudflare configuration

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-org/vfl-manager.git
   cd vfl-manager
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   npm start
   ```

4. **Register Discord Commands**
   ```bash
   curl -X POST "https://your-domain.com/discord/webhook/commandsHandler" \
     -H "Content-Type: application/json" \
     -d '{"mode": "INSTALL", "commandNames": ["vfl-trades", "vfl-scores", "vfl-teams"]}'
   ```

5. **Access Admin Portal**
   - Navigate to `https://your-domain.com/admin`
   - Login with your admin credentials
   - Configure Discord servers and channels

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Architecture Overview](ARCHITECTURE.md) - System architecture and design
- [API Documentation](docs/API.md) - Web API endpoints and usage
- [Discord Commands](docs/COMMANDS.md) - Complete command reference

## 🔧 Configuration

### Environment Variables

```env
# Discord Bot (Required)
DISCORD_TOKEN=your_discord_bot_token
PUBLIC_KEY=your_discord_public_key
APP_ID=your_discord_app_id

# Server Configuration
DEPLOYMENT_URL=your-domain.com
PORT=3000
NODE_ENV=production

# Database (Firestore)
SERVICE_ACCOUNT_FILE=/path/to/service-account.json

# Admin Portal
JWT_SECRET=your-secure-jwt-secret
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your-secure-password

# VFL Manager Settings
BOT_NAME=VFL Manager
DEFAULT_EMBED_COLOR=#1f8b4c
AUTO_POST_TRADES=true
AUTO_POST_SCORES=true
```

### Discord Server Setup

1. **Create Channels**:
   - `#trades` - For automated trade announcements
   - `#scores` - For automated game results
   - `#news` - For league news and updates

2. **Configure Bot Permissions**:
   - Send Messages
   - Embed Links
   - Use Slash Commands
   - Read Message History

3. **Set Channel IDs** (via admin portal or commands):
   ```
   /vfl-config set-trades-channel #trades
   /vfl-config set-scores-channel #scores
   ```

## 🎮 Usage Examples

### Discord Commands

```bash
# View recent trades
/vfl-trades recent

# Search trades by team
/vfl-trades team team_name:Patriots

# View game scores
/vfl-scores recent

# Get detailed game breakdown
/vfl-scores breakdown game_id:12345

# View team information
/vfl-teams info team_name:Patriots

# Add new trade (admin only)
/vfl-trades add from_team:Patriots to_team:Chiefs players:"Tom Brady (QB)"
```

### Web Interface

- **Public Site**: `https://your-domain.com`
- **Admin Portal**: `https://your-domain.com/admin`
- **API Endpoints**: `https://your-domain.com/api/vfl/*`

## 🔄 Migration from Snallabot

VFL Manager is designed to enhance your existing Snallabot installation:

1. **Preserves All Functionality**: Every existing Snallabot feature continues to work
2. **Uses Same Database**: Integrates with your existing Firestore setup
3. **Additive Enhancement**: Only adds new features, doesn't modify existing ones
4. **Seamless Integration**: New and old features work together perfectly

### Migration Steps

1. Backup your current Snallabot installation
2. Deploy VFL Manager code
3. Update environment variables
4. Register new Discord commands
5. Configure VFL-specific channels
6. Test all functionality

## Contributing

### Development Setup

VFL Manager welcomes contributions! To run a local development version:

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure your .env file

# Start development server
npm run dev

# Start Firestore emulator (optional)
firebase emulators:start --only firestore
```

### Original Snallabot Components

The original Snallabot functionality is preserved and enhanced:
- Node 21 (greater should be okay)
- Discord Application - free to register on [Discord Developer Portal](https://discord.com/developers/applications)

```sh
npm install
PUBLIC_KEY=??? DISCORD_TOKEN=??? APP_ID=??? DEPLOYMENT_URL=localhost:3000 npm run dev
```

Fill in the env variables with the ones from your Discord application. This will setup a firebase emulator, use local file storage, and make a local version of VFL Manager available at `localhost:3000`

### Additional Components

VFL Manager includes the original Snallabot components plus new automation:

#### EA Token Refresher

There are two EA tokens: access_token and refresh_token. The access_token expires after 4 hours, and then to retrieve a new one you use the refresh_token. This will give you a new access_token and refresh_token. Seemingly, both tokens will eventually expire after around 10 days of usage. Snallabot keeps all dashboards refreshed, and exports data with [ea_refresher.ts](https://github.com/snallabot/snallabot-service/blob/main/src/dashboard/ea_refresher.ts) file. This is an example of a way to keep data fresh. I recommend using it as reference and writing your own.

#### Youtube Notifier

This checks all youtube channels that have been added to Snallabot and sends messages in Discord if that channel is playing a game in that server's league (based on stream titles). Snallabot currently runs this every 10 minutes as a chron job.

```
npm run build && npm run yt-notifier
```

#### Twitch Notifier

VFL Manager includes Twitch integration for stream notifications.

#### VFL Automation Systems

New automation systems for VFL Manager:

**Trades Monitor**
```bash
# Automatically posts new trades to Discord channels
# Runs continuously via real-time Firestore listeners
```

**Scores Monitor**  
```bash
# Automatically posts game results to Discord channels
# Supports live game updates and final scores
```

## 📊 Analytics and Monitoring

VFL Manager includes comprehensive analytics:
- Command usage statistics
- User engagement metrics
- League activity trends
- System performance monitoring
- Real-time dashboard updates

## 🔒 Security

- **Authentication**: JWT-based admin authentication
- **Authorization**: Role-based access control
- **Data Protection**: Firestore security rules
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API endpoint protection
- **HTTPS**: SSL/TLS encryption everywhere

## 🎯 Roadmap

Future enhancements planned:
- [ ] Mobile app for league management
- [ ] Advanced statistical analysis
- [ ] Integration with fantasy platforms
- [ ] Machine learning for trade analysis
- [ ] Real-time game tracking
- [ ] Enhanced social features

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built on the solid foundation of Snallabot, VFL Manager extends the capabilities while preserving all existing functionality. Special thanks to the original Snallabot developers for creating such a robust and extensible system.

---

**VFL Manager** - Where fantasy football meets professional league management. 🏈

```
TWITCH_CALLBACK_URL: by default this would be /twitch/webhook
TWITCH_CLIENT_ID: from your Twitch developer account
TWITCH_CLIENT_SECRET: from your Twitch developer account
TWITCH_SECRET: a random secret you generate for Twitch, see Twitch EventSub https://dev.twitch.tv/docs/eventsub/handling-webhook-events/
```