# Snallabot Enhanced Architecture

This document outlines the architecture of the enhanced Snallabot system, including the Discord bot enhancements, public website, and admin portal.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare CDN                          │
│                    (SSL, Caching, Security)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   Load Balancer                                │
│                  (Nginx/Cloudflare)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 Node.js Application                            │
│                    (Koa.js Server)                            │
├─────────────────────┼───────────────────────────────────────────┤
│  Discord Bot        │  Public Website    │  Admin Portal       │
│  - Enhanced Commands│  - League Stats    │  - Bot Management   │
│  - Rich Embeds      │  - Team Info       │  - Analytics        │
│  - Interactive UI   │  - Player Data     │  - Configuration    │
│  - Channel Mgmt     │  - Real-time Data  │  - User Management  │
└─────────────────────┼───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   Data Layer                                   │
├─────────────────────┼───────────────────────────────────────────┤
│   Firestore DB      │   File Storage     │   External APIs     │
│   - League Data     │   - Static Assets  │   - Discord API     │
│   - User Settings   │   - Logs          │   - EA Sports API   │
│   - Analytics       │   - Backups       │   - Twitch API      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Discord Bot Enhancements

#### Enhanced Command System
```typescript
// New command structure with rich embeds and interactions
interface EnhancedCommand {
  embeds: APIEmbed[];
  components: APIActionRowComponent[];
  ephemeral?: boolean;
}
```

**Key Enhancements:**
- **Rich Embeds**: All responses use structured embeds with colors, thumbnails, and fields
- **Interactive Components**: Buttons and select menus for better UX
- **Channel Management**: Dedicated notification channels for different event types
- **Advanced Statistics**: Comprehensive league analytics and player comparisons

#### New Commands Added:
- `/set-channel` - Configure notification channels
- `/advanced-stats` - League leaders, salary cap, free agents
- Enhanced existing commands with better formatting and interactivity

#### Component Structure:
```
src/discord/
├── embeds/
│   └── embed_builder.ts          # Rich embed creation utilities
├── components/
│   └── button_builder.ts         # Interactive component builders
├── commands/
│   ├── channel_management.ts     # Channel configuration
│   ├── advanced_stats.ts         # Advanced statistics
│   └── [enhanced existing commands]
└── settings_db.ts               # Enhanced settings schema
```

### 2. Public Website

#### Frontend Architecture
```
src/web/public/
├── index.html                   # Main landing page
├── styles/
│   └── main.css                # Responsive CSS with animations
├── scripts/
│   └── main.js                 # Vanilla JS with modern features
└── assets/                     # Static assets (images, icons)
```

**Features:**
- **Responsive Design**: Mobile-first approach with breakpoints
- **Real-time Data**: Live league statistics and standings
- **SEO Optimized**: Meta tags, structured data, fast loading
- **Progressive Enhancement**: Works without JavaScript

#### API Layer
```
src/web/routes/
└── api.ts                      # RESTful API endpoints
```

**Endpoints:**
- `GET /api/league/standings` - Current league standings
- `GET /api/league/teams` - Team information and stats
- `GET /api/league/leaders/:category` - Statistical leaders
- `GET /api/league/players/:id` - Individual player details

### 3. Admin Portal

#### Authentication & Authorization
```typescript
// JWT-based authentication with role-based access
interface AdminUser {
  email: string;
  role: 'admin' | 'moderator';
  permissions: string[];
}
```

#### Admin Features:
- **Dashboard Overview**: System health, usage statistics
- **Server Management**: Configure Discord servers and settings
- **Channel Management**: Visual channel assignment interface
- **Analytics**: Command usage, user engagement metrics
- **Bot Status**: Real-time monitoring and health checks

#### Admin Structure:
```
src/web/routes/
└── admin.ts                    # Admin API and page routes

src/web/public/
├── styles/admin.css           # Admin-specific styling
└── scripts/
    ├── admin-login.js         # Login functionality
    └── admin-dashboard.js     # Dashboard management
```

## Data Flow Architecture

### 1. Discord Bot Data Flow
```
Discord User Input
       ↓
Command Handler
       ↓
Database Query (Firestore)
       ↓
Data Processing & Formatting
       ↓
Rich Embed Generation
       ↓
Discord API Response
```

### 2. Public Website Data Flow
```
User Request
       ↓
Cloudflare CDN (Cache Check)
       ↓
Node.js Server
       ↓
API Route Handler
       ↓
Database Query (Read-only)
       ↓
Data Transformation
       ↓
JSON Response
       ↓
Frontend Rendering
```

### 3. Admin Portal Data Flow
```
Admin Login
       ↓
JWT Authentication
       ↓
Role-based Authorization
       ↓
Admin API Access
       ↓
Database Operations (Read/Write)
       ↓
Real-time Updates
```

## Database Schema

### Enhanced Settings Schema
```typescript
interface LeagueSettings {
  commands: {
    // Existing commands...
    channel_management?: {
      notification_channels: {
        roster_updates?: ChannelId;
        stats_updates?: ChannelId;
        trades?: ChannelId;
        free_agents?: ChannelId;
        injuries?: ChannelId;
        contracts?: ChannelId;
        draft?: ChannelId;
        playoffs?: ChannelId;
      }
    }
  }
}
```

### Analytics Schema
```typescript
interface CommandUsage {
  command: string;
  serverId: string;
  userId: string;
  timestamp: Date;
  success: boolean;
  responseTime: number;
}

interface ServerMetrics {
  serverId: string;
  memberCount: number;
  commandsUsed: number;
  lastActivity: Date;
  features: string[];
}
```

## Security Architecture

### 1. Authentication Layers
```
Public Website: No authentication (read-only data)
       ↓
Admin Portal: JWT + Role-based access
       ↓
Discord Bot: Discord OAuth + Server permissions
       ↓
Database: Service account + Security rules
```

### 2. Data Protection
- **Environment Variables**: All secrets in `.env` files
- **Database Rules**: Firestore security rules for data access
- **API Rate Limiting**: Prevent abuse and DoS attacks
- **Input Validation**: Sanitize all user inputs
- **HTTPS Everywhere**: SSL/TLS for all communications

### 3. Security Headers
```typescript
// Implemented via Cloudflare and Nginx
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'"
};
```

## Performance Architecture

### 1. Caching Strategy
```
Level 1: Cloudflare CDN (Static assets, API responses)
Level 2: Application Cache (Database queries, computed data)
Level 3: Database Optimization (Indexes, query optimization)
```

### 2. Optimization Techniques
- **Code Splitting**: Separate bundles for different features
- **Lazy Loading**: Load components on demand
- **Image Optimization**: WebP format with fallbacks
- **Database Indexing**: Optimized queries for common operations
- **Connection Pooling**: Efficient database connections

### 3. Monitoring & Observability
```typescript
// Performance monitoring
interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  errorRate: number;
}
```

## Scalability Considerations

### 1. Horizontal Scaling
- **Stateless Design**: No server-side sessions (JWT tokens)
- **Load Balancing**: Multiple server instances behind load balancer
- **Database Sharding**: Partition data by league/server ID
- **CDN Distribution**: Global content delivery

### 2. Vertical Scaling
- **Resource Optimization**: Efficient memory and CPU usage
- **Database Optimization**: Query performance and indexing
- **Caching**: Reduce database load with intelligent caching
- **Connection Management**: Efficient database connection pooling

### 3. Auto-scaling Triggers
```typescript
interface ScalingMetrics {
  cpuThreshold: 70;        // Scale up at 70% CPU
  memoryThreshold: 80;     // Scale up at 80% memory
  responseTimeThreshold: 500; // Scale up if response > 500ms
  errorRateThreshold: 5;   // Scale up if error rate > 5%
}
```

## Deployment Architecture

### 1. Environment Separation
```
Development → Staging → Production
     ↓           ↓         ↓
   Local DB   Test DB   Prod DB
   Test Bot   Stage Bot  Prod Bot
```

### 2. CI/CD Pipeline
```
Code Commit
     ↓
Automated Tests
     ↓
Build & Bundle
     ↓
Deploy to Staging
     ↓
Integration Tests
     ↓
Deploy to Production
     ↓
Health Checks
```

### 3. Infrastructure Components
- **Application Server**: Node.js with PM2 process management
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **CDN**: Cloudflare for global content delivery
- **Database**: Firebase Firestore with automated backups
- **Monitoring**: Application and infrastructure monitoring

## Integration Points

### 1. External APIs
- **Discord API**: Bot commands and interactions
- **EA Sports API**: Madden league data synchronization
- **Twitch API**: Stream notifications and integrations
- **YouTube API**: Video content and notifications

### 2. Webhook Integrations
- **Discord Webhooks**: Real-time event notifications
- **Twitch Webhooks**: Stream status updates
- **Database Triggers**: Automated data processing

### 3. Third-party Services
- **Cloudflare**: CDN, security, and performance
- **Firebase**: Database and authentication
- **GitHub**: Version control and CI/CD

This architecture provides a robust, scalable, and maintainable foundation for the enhanced Snallabot system while preserving all existing functionality and adding powerful new features.