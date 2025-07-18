# VFL Manager Deployment Guide

This comprehensive guide covers deploying the VFL Manager sports trading and statistics Discord bot with web portal while preserving all existing Snallabot functionality.

## 🎯 Overview

VFL Manager enhances your existing Snallabot with:
- **Automated Trades Channel**: Real-time trade posting with beautiful embeds
- **Automated Scores Channel**: Game results posted automatically
- **Rich Discord Commands**: Professional embeds with team logos and statistics
- **Public Website**: Multi-page site with live data from your Firestore database
- **Admin Portal**: Complete management interface for league administration
- **Seamless Integration**: Uses existing Firestore database without modifications

## 📋 Prerequisites

- Existing Snallabot installation with working Firestore database
- Node.js 18.x or higher
- Discord application with bot token
- Domain configured with Cloudflare (replacing ngrok)
- SSL certificate (handled by Cloudflare)

## 🔧 Environment Configuration

### 1. Update Environment Variables

Copy your existing `.env` file and add the VFL Manager specific variables:

```bash
# Copy existing configuration
cp .env .env.backup

# Add VFL Manager variables to your .env file
```

Add these new variables to your existing `.env`:

```env
# VFL Manager Configuration
BOT_NAME=VFL Manager
DEFAULT_EMBED_COLOR=#1f8b4c
TEAM_LOGO_BASE_URL=https://your-cdn.com/logos/

# Web Dashboard Configuration
JWT_SECRET=your-secure-jwt-secret-here-change-in-production
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your-secure-admin-password

# Website Configuration
WEBSITE_TITLE=VFL Manager Hub
WEBSITE_DESCRIPTION=Your premier destination for VFL trading and statistics
DISCORD_INVITE_URL=https://discord.gg/your-invite-code

# Automation Settings
AUTO_POST_TRADES=true
AUTO_POST_SCORES=true
TRADE_CHECK_INTERVAL=300000
SCORE_CHECK_INTERVAL=600000
```

### 2. Validate Configuration

The system will validate all required environment variables on startup. Ensure these are set:

- `DISCORD_TOKEN` (existing)
- `PUBLIC_KEY` (existing)
- `APP_ID` (existing)
- `DEPLOYMENT_URL` (update from ngrok to your domain)
- `JWT_SECRET` (new)
- `ADMIN_EMAIL` (new)
- `ADMIN_PASSWORD` (new)

## 🗄️ Database Setup

### Firestore Collections

VFL Manager adds these new collections to your existing Firestore database:

```
vfl_teams/          # Team information and statistics
vfl_players/        # Player profiles and stats
vfl_trades/         # Trade records and history
vfl_games/          # Game results and schedules
vfl_news/           # League news and updates
vfl_config/         # Bot configuration per Discord server
```

### Initialize VFL Collections

Run this script to set up the initial VFL collections:

```javascript
// Initialize VFL collections in Firestore
const initializeVFLCollections = async () => {
  // Sample team data
  await db.collection('vfl_teams').doc('sample-team').set({
    name: 'Sample Team',
    city: 'Sample City',
    abbreviation: 'SAM',
    conference: 'AFC',
    division: 'North',
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#1f8b4c',
    record: { wins: 0, losses: 0, ties: 0 },
    stats: { pointsFor: 0, pointsAgainst: 0 },
    createdAt: new Date()
  });

  // Sample configuration
  await db.collection('vfl_config').doc('your-guild-id').set({
    tradesChannelId: null,
    scoresChannelId: null,
    autoPostTrades: true,
    autoPostScores: true,
    embedColor: '#1f8b4c'
  });
};
```

### Security Rules Update

Add these rules to your existing Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // VFL Manager collections - public read, admin write
    match /vfl_teams/{document=**} {
      allow read: if true;
      allow write: if false; // Only server-side writes
    }
    
    match /vfl_players/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /vfl_trades/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /vfl_games/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /vfl_news/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /vfl_config/{document=**} {
      allow read, write: if false; // Server-side only
    }
  }
}
```

## 🤖 Discord Bot Setup

### 1. Register New Commands

The VFL Manager adds these new Discord commands:

- `/vfl-trades` - View and manage trades
- `/vfl-scores` - View game scores and schedules  
- `/vfl-teams` - Team information and rosters

Register the new commands:

```bash
# Register commands globally (production)
curl -X POST "https://your-domain.com/discord/webhook/commandsHandler" \
  -H "Content-Type: application/json" \
  -d '{"mode": "INSTALL", "commandNames": ["vfl-trades", "vfl-scores", "vfl-teams"]}'

# Register for specific guild (testing)
curl -X POST "https://your-domain.com/discord/webhook/commandsHandler" \
  -H "Content-Type: application/json" \
  -d '{"mode": "INSTALL", "guildId": "your-guild-id", "commandNames": ["vfl-trades", "vfl-scores", "vfl-teams"]}'
```

### 2. Configure Channels

Set up automated posting channels using Discord commands:

```
/vfl-config set-trades-channel #trades
/vfl-config set-scores-channel #scores
/vfl-config set-news-channel #news
```

Or configure via the admin portal at `https://your-domain.com/admin`

## 🌐 Domain and Hosting Setup

### 1. Cloudflare Configuration

Replace ngrok with your custom domain:

#### DNS Settings
```
Type: A
Name: @
Content: your-server-ip
Proxy: Enabled (orange cloud)

Type: CNAME  
Name: www
Content: your-domain.com
Proxy: Enabled
```

#### SSL/TLS Settings
- Set encryption mode to "Full (strict)"
- Enable "Always Use HTTPS"
- Set minimum TLS version to 1.2

#### Performance Settings
- Enable Brotli compression
- Set Browser Cache TTL to "4 hours"
- Enable "Auto Minify" for HTML, CSS, JS

#### Security Settings
- Set Security Level to "Medium"
- Enable "Bot Fight Mode"
- Configure rate limiting:
  - `/api/*` - 100 requests per minute
  - `/admin/*` - 20 requests per minute

### 2. Update Application Configuration

Update your `DEPLOYMENT_URL` environment variable:

```env
# Replace ngrok URL
DEPLOYMENT_URL=your-domain.com
```

## 🚀 Application Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Application

```bash
npm run build
```

### 3. Deploy with PM2 (Recommended)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'vfl-manager',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Deploy:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL handled by Cloudflare
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Static files with caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API and admin routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Configuration and Testing

### 1. Admin Portal Setup

1. Navigate to `https://your-domain.com/admin`
2. Login with your admin credentials
3. Configure Discord servers and channels
4. Set up teams and initial data

### 2. Discord Bot Testing

Test the new commands in your Discord server:

```
/vfl-trades recent
/vfl-scores recent  
/vfl-teams list
```

### 3. Automation Testing

1. Add a test trade via admin portal
2. Verify it posts to the trades channel
3. Add a test game result
4. Verify it posts to the scores channel

### 4. Website Testing

1. Visit `https://your-domain.com`
2. Verify all sections load data correctly
3. Test responsive design on mobile
4. Check that data updates in real-time

## 📊 Monitoring and Maintenance

### 1. Health Checks

```bash
# Check application health
curl https://your-domain.com/api/vfl/health

# Check admin portal
curl https://your-domain.com/admin/api/system-status
```

### 2. Log Monitoring

```bash
# View application logs
pm2 logs vfl-manager

# View specific log files
tail -f logs/combined.log
```

### 3. Database Monitoring

Monitor Firestore usage in the Firebase Console:
- Document reads/writes
- Storage usage
- Security rule evaluations

## 🔒 Security Considerations

### 1. Environment Variables
- Use strong, unique passwords for admin accounts
- Rotate JWT secrets regularly
- Never commit `.env` files to version control

### 2. Database Security
- Firestore security rules restrict write access
- Admin portal uses JWT authentication
- All API endpoints have proper validation

### 3. Web Security
- HTTPS enforced everywhere
- Security headers via Cloudflare
- Rate limiting on API endpoints
- Input validation and sanitization

## 🔄 Migration from Existing Setup

### 1. Backup Current System

```bash
# Backup current application
tar -czf snallabot-backup-$(date +%Y%m%d).tar.gz \
  /app/dist \
  /app/.env \
  /app/ecosystem.config.js

# Export Firestore data
gcloud firestore export gs://your-backup-bucket/$(date +%Y%m%d)
```

### 2. Deploy VFL Manager

1. Deploy the enhanced application
2. Test all existing functionality
3. Verify new VFL features work
4. Update DNS to point to new domain

### 3. Verify Migration

- [ ] All existing Snallabot commands work
- [ ] Existing data is accessible
- [ ] New VFL commands are available
- [ ] Website loads and displays data
- [ ] Admin portal is accessible
- [ ] Automation systems are running

## 🆘 Troubleshooting

### Common Issues

1. **Discord commands not working**
   - Verify bot permissions in Discord server
   - Check command registration status
   - Review Discord API rate limits

2. **Database connection errors**
   - Verify Firestore security rules
   - Check service account credentials
   - Ensure network connectivity

3. **Website not loading**
   - Check Cloudflare configuration
   - Verify static file serving
   - Review browser console for errors

4. **Admin portal access denied**
   - Verify JWT_SECRET is set
   - Check admin credentials
   - Review authentication logs

### Debug Commands

```bash
# Test Discord webhook
curl -X POST "https://your-domain.com/discord/webhook/slashCommand" \
  -H "Content-Type: application/json" \
  -d '{"type": 1}'

# Test VFL API
curl "https://your-domain.com/api/vfl/health"

# Test admin authentication
curl -X POST "https://your-domain.com/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@your-domain.com", "password": "your-password"}'
```

## 📈 Performance Optimization

### 1. Caching Strategy
- Cloudflare CDN for static assets
- Application-level caching for database queries
- Browser caching for API responses

### 2. Database Optimization
- Proper indexing for common queries
- Efficient query patterns
- Connection pooling

### 3. Monitoring
- Application performance monitoring
- Database query performance
- User experience metrics

## 🎉 Success Criteria

Your VFL Manager deployment is successful when:

- [ ] All existing Snallabot functionality preserved
- [ ] New VFL commands work in Discord
- [ ] Automated trade posting works
- [ ] Automated score posting works
- [ ] Public website displays live data
- [ ] Admin portal allows full management
- [ ] System runs on custom domain
- [ ] All data syncs between bot and website
- [ ] Performance is optimal
- [ ] Security measures are in place

## 📞 Support

For deployment assistance:
1. Check the troubleshooting section above
2. Review application logs for errors
3. Verify all environment variables are set
4. Test each component individually
5. Ensure Firestore permissions are correct

The VFL Manager system is designed to enhance your existing Snallabot while maintaining 100% backward compatibility. All new features integrate seamlessly with your current setup.