# ⚙️ **PRODUCTION CONFIGURATION GUIDE**
## **Complete Setup for Discord Integration**

---

## 🎯 **CONFIGURATION OVERVIEW**

This guide provides **step-by-step instructions** for configuring DobbyX for production deployment in a **500K+ member Discord server**.

---

## 🔐 **DISCORD APPLICATION SETUP**

### **📋 Step 1: Create Discord Application**
```bash
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name: "DobbyX - AI Rebellion"
4. Click "Create"
```

### **🤖 Step 2: Configure Bot Settings**
```bash
1. Navigate to "Bot" section
2. Click "Add Bot"
3. Configure Bot Settings:
   - Username: "DobbyX"
   - Avatar: Upload Dobby-themed image
   - Public Bot: ✅ ENABLED
   - Require OAuth2 Code Grant: ❌ DISABLED
   - Bot Permissions: See permissions section below
```

### **🔗 Step 3: OAuth2 Configuration**
```bash
1. Navigate to "OAuth2" → "URL Generator"
2. Select Scopes:
   ✅ bot
   ✅ applications.commands
3. Select Bot Permissions:
   ✅ Send Messages (2048)
   ✅ Use Slash Commands (2147483648)
   ✅ Embed Links (16384)
   ✅ Attach Files (32768)
   ✅ Read Message History (65536)
   ✅ Use External Emojis (262144)
   ✅ Add Reactions (64)
   
4. Copy Generated URL for server invites
```

### **📊 Step 4: Application Information**
```bash
1. Navigate to "General Information"
2. Fill out required fields:
   - Description: "AI Uprising Simulator - Join Dobby's rebellion against corporate AI control!"
   - Tags: Game, AI, Entertainment, Community
   - Privacy Policy URL: https://yourdomain.com/privacy
   - Terms of Service URL: https://yourdomain.com/terms
```

---

## 🔑 **ENVIRONMENT VARIABLES SETUP**

### **📝 Production .env Configuration**
```bash
# Discord Configuration (REQUIRED)
DISCORD_TOKEN=your_actual_bot_token_here
DISCORD_CLIENT_ID=your_actual_client_id_here
GUILD_ID=your_target_server_id_here

# AI Configuration (REQUIRED)
FIREWORKS_API_KEY=your_actual_fireworks_api_key
DOBBY_MODEL_ID=accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new

# Database Configuration (PRODUCTION)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dobbyx
REDIS_URL=redis://username:password@redis-host:6379

# Security Configuration
NODE_ENV=production
LOG_LEVEL=info
SESSION_SECRET=your_secure_random_session_secret
JWT_SECRET=your_secure_jwt_secret

# Game Configuration
DAILY_ENERGY=100
RAID_COOLDOWN=300
MAX_INVENTORY_SIZE=50
BACKUP_INTERVAL=30
ENERGY_REGEN_RATE=1

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn_for_error_tracking
DATADOG_API_KEY=your_datadog_api_key

# Email Configuration (for support)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@yourdomain.com
SMTP_PASS=your_email_password

# Domain Configuration
BASE_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

### **🔒 Environment Variable Security**
```bash
# Use environment variable management services:
# - AWS Systems Manager Parameter Store
# - Google Cloud Secret Manager
# - Azure Key Vault
# - HashiCorp Vault

# Never commit .env files to version control
# Use .env.example for documentation only
# Rotate secrets regularly (monthly recommended)
```

---

## 🗄️ **DATABASE CONFIGURATION**

### **🍃 MongoDB Atlas Setup**
```bash
# Step 1: Create MongoDB Atlas Account
1. Go to https://cloud.mongodb.com
2. Create account and verify email
3. Create new project: "DobbyX Production"

# Step 2: Create Cluster
1. Choose cloud provider (AWS recommended)
2. Select region closest to your server
3. Choose cluster tier (M30 recommended for production)
4. Set cluster name: "dobbyx-prod"

# Step 3: Configure Security
1. Database Access → Add Database User
   - Username: dobbyx_app
   - Password: Generate secure password
   - Role: readWrite on dobbyx database
   
2. Network Access → Add IP Address
   - Add your server's IP address
   - Or use 0.0.0.0/0 for development (not recommended for production)

# Step 4: Get Connection String
1. Connect → Connect your application
2. Copy connection string
3. Replace <password> with actual password
4. Add to MONGODB_URI environment variable
```

### **⚡ Redis Configuration**
```bash
# Option 1: Redis Cloud (Recommended)
1. Go to https://redis.com/redis-enterprise-cloud/
2. Create free account
3. Create new subscription
4. Choose cloud provider and region
5. Get connection details for REDIS_URL

# Option 2: AWS ElastiCache
1. Go to AWS ElastiCache console
2. Create Redis cluster
3. Choose node type (cache.t3.micro for start)
4. Configure security groups
5. Get endpoint for REDIS_URL

# Option 3: Self-hosted Redis
1. Install Redis on your server
2. Configure redis.conf for production
3. Set up authentication
4. Configure persistence
```

---

## 🚀 **DEPLOYMENT CONFIGURATION**

### **🐳 Docker Setup**
```dockerfile
# Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Bundle app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S dobbyx -u 1001
USER dobbyx

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
```

### **📦 Docker Compose (Development)**
```yaml
# docker-compose.yml
version: '3.8'

services:
  dobbyx:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=${REDIS_URL}
      - DISCORD_TOKEN=${DISCORD_TOKEN}
    depends_on:
      - redis
      - mongodb
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    restart: unless-stopped

volumes:
  redis_data:
  mongodb_data:
```

---

## 🔧 **APPLICATION CONFIGURATION**

### **📊 Logging Configuration**
```javascript
// src/config/logging.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dobbyx' },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File logging
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Production: Add external logging service
if (process.env.NODE_ENV === 'production') {
  // Add Datadog, Splunk, or other logging service
  logger.add(new winston.transports.Http({
    host: 'logs.datadoghq.com',
    path: '/v1/input/YOUR_API_KEY',
    ssl: true
  }));
}

export default logger;
```

### **🔒 Security Configuration**
```javascript
// src/config/security.js
export const securityConfig = {
  // Rate limiting
  rateLimiting: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    credentials: true
  },
  
  // Helmet security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }
};
```

---

## 📊 **MONITORING SETUP**

### **🔍 Health Check Endpoint**
```javascript
// healthcheck.js
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

### **📈 Metrics Collection**
```javascript
// src/middleware/metrics.js
import prometheus from 'prom-client';

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new prometheus.Gauge({
  name: 'dobbyx_active_users',
  help: 'Number of active users'
});

const commandsExecuted = new prometheus.Counter({
  name: 'dobbyx_commands_total',
  help: 'Total number of commands executed',
  labelNames: ['command']
});

export { httpRequestDuration, activeUsers, commandsExecuted };
```

---

## 🔄 **BACKUP CONFIGURATION**

### **💾 Automated Backup Script**
```bash
#!/bin/bash
# backup.sh

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" "$BACKUP_DIR/mongodb_$DATE"
rm -rf "$BACKUP_DIR/mongodb_$DATE"

# Upload to cloud storage (AWS S3 example)
aws s3 cp "$BACKUP_DIR/mongodb_$DATE.tar.gz" "s3://dobbyx-backups/"

# Clean up old backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: mongodb_$DATE.tar.gz"
```

### **⏰ Cron Job Setup**
```bash
# Add to crontab (crontab -e)
# Run backup every 6 hours
0 */6 * * * /path/to/backup.sh >> /var/log/dobbyx-backup.log 2>&1

# Run daily cleanup
0 2 * * * /path/to/cleanup.sh >> /var/log/dobbyx-cleanup.log 2>&1
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **🔧 Pre-Deployment**
- [ ] **Discord Application** created and configured
- [ ] **Bot Token** obtained and secured
- [ ] **OAuth2 URL** generated and tested
- [ ] **Environment Variables** configured
- [ ] **Database** set up and accessible
- [ ] **Redis Cache** configured
- [ ] **Domain** purchased and DNS configured
- [ ] **SSL Certificate** obtained

### **📦 Deployment**
- [ ] **Code** deployed to production server
- [ ] **Dependencies** installed
- [ ] **Environment** variables loaded
- [ ] **Database** migrations run
- [ ] **Health Checks** passing
- [ ] **Monitoring** configured
- [ ] **Backups** scheduled

### **✅ Post-Deployment**
- [ ] **Bot** responds to commands
- [ ] **All Features** working correctly
- [ ] **Performance** metrics within targets
- [ ] **Error Rates** below 1%
- [ ] **Monitoring Alerts** configured
- [ ] **Support Channels** established

---

## 🎯 **FINAL CONFIGURATION NOTES**

### **🔒 Security Best Practices**
1. **Never commit secrets** to version control
2. **Use environment variables** for all configuration
3. **Rotate API keys** regularly
4. **Monitor for security vulnerabilities**
5. **Keep dependencies updated**

### **📊 Performance Optimization**
1. **Enable Redis caching** for frequently accessed data
2. **Use connection pooling** for database connections
3. **Implement rate limiting** to prevent abuse
4. **Monitor resource usage** and scale accordingly
5. **Optimize database queries** and indexes

### **🚨 Incident Response**
1. **Set up monitoring alerts** for critical metrics
2. **Create runbooks** for common issues
3. **Establish escalation procedures**
4. **Test backup and recovery procedures**
5. **Document troubleshooting steps**

---

**🎯 NEXT STEP: Complete Discord Application setup and obtain all required tokens and IDs before proceeding with deployment.**
