# Snallabot Enhanced Deployment Guide

This guide covers deploying the enhanced Snallabot with new Discord bot features, public website, and admin portal.

## Prerequisites

- Node.js 21.x or higher
- Firebase project with Firestore
- Discord application with bot token
- Domain configured with Cloudflare
- SSL certificate (handled by Cloudflare)

## Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:

### Required Discord Configuration
```env
DISCORD_TOKEN=your_discord_bot_token
PUBLIC_KEY=your_discord_public_key
APP_ID=your_discord_app_id
```

### Database Configuration
```env
# For production with service account file
SERVICE_ACCOUNT_FILE=/path/to/service-account.json

# OR for production with inline service account
SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}

# For development with emulator
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Server Configuration
```env
DEPLOYMENT_URL=your-domain.com
PORT=3000
NODE_ENV=production
```

### Web Interface Configuration
```env
JWT_SECRET=your-secure-jwt-secret-here
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=your-secure-admin-password
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

## Database Setup

### Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Create a service account:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Save the JSON file securely

### Database Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to league data for public website
    match /league_data/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Restrict admin access to league settings
    match /league_settings/{document=**} {
      allow read, write: if false; // Only server-side access
    }
    
    // Allow read access to events for public stats
    match /events/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Discord Bot Setup

### Register New Commands

The enhanced bot includes new commands that need to be registered:

```bash
# Register commands globally (production)
curl -X POST "https://your-domain.com/discord/webhook/commandsHandler" \
  -H "Content-Type: application/json" \
  -d '{"mode": "INSTALL"}'

# Register commands for specific guild (development)
curl -X POST "https://your-domain.com/discord/webhook/commandsHandler" \
  -H "Content-Type: application/json" \
  -d '{"mode": "INSTALL", "guildId": "your-guild-id"}'
```

### New Commands Available

- `/set-channel` - Configure notification channels
- `/advanced-stats` - Advanced league statistics
- Enhanced `/player` command with interactive components
- Enhanced `/standings` with rich embeds
- Enhanced `/teams` with better formatting

## Cloudflare Configuration

### DNS Settings

1. Add A record pointing to your server IP:
```
Type: A
Name: @
Content: your-server-ip
Proxy: Enabled (orange cloud)
```

2. Add CNAME for www:
```
Type: CNAME
Name: www
Content: your-domain.com
Proxy: Enabled
```

### SSL/TLS Settings

1. Set SSL/TLS encryption mode to "Full (strict)"
2. Enable "Always Use HTTPS"
3. Set minimum TLS version to 1.2

### Performance Settings

1. Enable Brotli compression
2. Set Browser Cache TTL to "4 hours"
3. Enable "Auto Minify" for HTML, CSS, JS

### Security Settings

1. Set Security Level to "Medium"
2. Enable "Bot Fight Mode"
3. Configure rate limiting:
   - `/api/*` - 100 requests per minute
   - `/admin/*` - 20 requests per minute

## Server Deployment

### Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'snallabot',
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

3. Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Docker

1. Create `Dockerfile`:
```dockerfile
FROM node:21-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY src/web/public/ ./dist/web/public/

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

2. Build and run:
```bash
docker build -t snallabot .
docker run -d --name snallabot -p 3000:3000 --env-file .env snallabot
```

## Nginx Configuration (Optional)

If using Nginx as a reverse proxy:

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

    # Static files
    location /assets/ {
        alias /app/dist/web/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /styles/ {
        alias /app/dist/web/public/styles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /scripts/ {
        alias /app/dist/web/public/scripts/;
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

## Monitoring and Logging

### Application Monitoring

1. Set up log rotation:
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/snallabot
```

```
/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        pm2 reloadLogs
    endscript
}
```

2. Monitor with PM2:
```bash
pm2 monit
pm2 logs snallabot
```

### Health Checks

Create a health check endpoint by adding to your server:

```bash
# Check application health
curl https://your-domain.com/api/health

# Check Discord bot status
curl https://your-domain.com/debug/cacheStats
```

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords for admin accounts
- Rotate JWT secrets regularly
- Use different secrets for development and production

### Database Security
- Restrict Firestore access with security rules
- Use service accounts with minimal required permissions
- Enable audit logging for admin actions

### Web Security
- Enable HTTPS everywhere
- Use secure headers (handled by Cloudflare)
- Implement rate limiting
- Validate all user inputs
- Use CSRF protection for admin forms

## Backup Strategy

### Database Backups
```bash
# Export Firestore data
gcloud firestore export gs://your-backup-bucket/$(date +%Y%m%d)
```

### Application Backups
```bash
# Backup application files and configuration
tar -czf snallabot-backup-$(date +%Y%m%d).tar.gz \
  /app/dist \
  /app/.env \
  /app/ecosystem.config.js
```

## Troubleshooting

### Common Issues

1. **Discord commands not working**
   - Verify bot permissions in Discord server
   - Check command registration status
   - Review Discord API rate limits

2. **Database connection errors**
   - Verify service account credentials
   - Check Firestore security rules
   - Ensure network connectivity

3. **Web interface not loading**
   - Check static file serving
   - Verify Cloudflare configuration
   - Review browser console for errors

### Debug Commands

```bash
# Check application logs
pm2 logs snallabot

# Test Discord webhook
curl -X POST "https://your-domain.com/discord/webhook/slashCommand" \
  -H "Content-Type: application/json" \
  -d '{"type": 1}'

# Test API endpoints
curl "https://your-domain.com/api/league/standings"

# Check admin authentication
curl -X POST "https://your-domain.com/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@your-domain.com", "password": "your-password"}'
```

## Performance Optimization

### Caching Strategy
- Enable Cloudflare caching for static assets
- Implement Redis for session storage (optional)
- Use database query optimization

### Resource Optimization
- Minimize bundle sizes
- Optimize images and assets
- Enable gzip/brotli compression
- Use CDN for static assets

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and rotate secrets quarterly
- Monitor disk space and logs
- Update Discord command descriptions as needed

### Scaling Considerations
- Monitor memory usage and CPU utilization
- Consider database sharding for large datasets
- Implement horizontal scaling with load balancers
- Use database read replicas for public website

This deployment guide ensures your enhanced Snallabot runs reliably in production with all new features properly configured and secured.