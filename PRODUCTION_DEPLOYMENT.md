# Production Deployment Guide
## Injibara House Rental & Broker Platform

---

## 1. Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB SSD | 50 GB SSD |
| Node.js | 18.x LTS | 20.x LTS |
| MySQL | 8.0 | 8.0+ |

---

## 2. Environment Variables

Create a `.env` file on the production server with the following variables:

```bash
# Server
NODE_ENV=production
PORT=5002
CLIENT_URL=https://your-domain.com

# Database
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=house_rental_app
DB_PASSWORD=<STRONG_PASSWORD>
DB_NAME=house_rental

# Security
JWT_SECRET=<32+_CHARACTER_RANDOM_STRING>
PUBLIC_BASE_URL=https://your-domain.com

# SMS
TEXTBEE_API_KEY=<YOUR_API_KEY>
TEXTBEE_DEVICE_ID=<YOUR_DEVICE_ID>
TEXTBEE_WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>

# AI
GEMINI_API_KEY=<YOUR_GEMINI_KEY>

# Support
SUPPORT_PHONE=+251000000000
SUPPORT_EMAIL=support@example.com

# Optional
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
TRUST_PROXY=1
ALLOW_SQLITE_FALLBACK=false
```

**Never commit `.env` to version control.**

---

## 3. Secret Generation

Generate strong secrets using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Database Setup

```sql
CREATE DATABASE house_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'house_rental_app'@'localhost' IDENTIFIED BY '<STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON house_rental.* TO 'house_rental_app'@'localhost';
FLUSH PRIVILEGES;
```

The application automatically creates tables and seeds initial data on first run.

---

## 5. HTTPS Configuration

**Required:** Terminate TLS at a reverse proxy (nginx, Cloudflare, or load balancer).

Example nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5002;
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

---

## 6. Reverse Proxy Configuration

```
Internet
   ↓
HTTPS / Reverse Proxy / Cloudflare / Load Balancer
   ↓
Node.js backend (port 5002)
   ↓
MySQL
```

**Never expose the Node.js backend directly to the public internet.**

---

## 7. Frontend Build

```bash
npm install
npm run build
```

The build output is in `dist/`.

---

## 8. Backend Startup

```bash
# Install dependencies
npm install --production

# Start with PM2 (recommended)
pm2 start dist/server.cjs --name injibara-house

# Or start directly
node dist/server.cjs
```

---

## 9. Process Manager

Use PM2 for production:

```bash
npm install -g pm2
pm2 start dist/server.cjs --name injibara-house
pm2 startup
pm2 save
```

---

## 10. Database Backups

### Manual Backup
```bash
node scripts/backup.js
```

### Automated Daily Backup (Linux Cron)
```bash
0 2 * * * /usr/bin/node /path/to/injibara-house/scripts/backup.js >> /var/log/injibara-backup.log 2>&1
```

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\path\to\injibara-house\scripts\backup.js`

### Backup Restoration
```bash
gunzip < backup-house_rental-2024-01-01-000000.sql.gz | mysql -u house_rental_app -p house_rental
```

### Test Restoration
1. Create a test database
2. Restore backup to test database
3. Verify data integrity
4. Drop test database

---

## 11. Monitoring

Recommended:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Log aggregation (Papertrail, LogDNA)
- Database monitoring (MySQL Workbench, Percona Monitoring)

---

## 12. Security Checklist

- [ ] `.env` is not committed to version control
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] `PUBLIC_BASE_URL` uses HTTPS
- [ ] MySQL user has least-privilege access
- [ ] TLS termination is configured
- [ ] Backups are automated and tested
- [ ] Rate limiting is active
- [ ] CSRF protection is enabled
- [ ] CORS is restricted to your domain
- [ ] Helmet security headers are enabled
- [ ] File upload validation is active
- [ ] Admin 2FA is enforced
- [ ] OTP lockout is configured
- [ ] Graceful shutdown is tested

---

## 13. Rollback Procedure

1. Stop current server: `pm2 stop injibara-house`
2. Deploy previous version
3. Start server: `pm2 start dist/server.cjs --name injibara-house`
4. Verify health: `curl https://your-domain.com/api/health`

---

## 14. Emergency Shutdown

```bash
pm2 stop injibara-house
# Or if using systemd:
systemctl stop injibara-house
```

---

## 15. Architecture Diagram

```
┌─────────────┐
│   Internet  │
└──────┬──────┘
       │
┌──────▼────────────────────────┐
│  Reverse Proxy / Cloudflare   │
│  (HTTPS Termination)          │
└──────┬────────────────────────┘
       │
┌──────▼────────────────────────┐
│   Node.js + Express Backend   │
│   Port 5002                   │
│                               │
│   - JWT Authentication        │
│   - CSRF Protection           │
│   - Rate Limiting             │
│   - Helmet Security Headers   │
└──────┬────────────────────────┘
       │
┌──────▼────────────────────────┐
│        MySQL Database         │
│   house_rental                │
└───────────────────────────────┘
```

---

## 16. Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5002 in use | `lsof -ti:5002 | xargs kill -9` |
| MySQL connection refused | Check `DB_HOST`, `DB_PORT`, MySQL service status |
| JWT secret too short | Generate 32+ character secret |
| CORS errors | Verify `CLIENT_URL` matches frontend origin |
| Backup fails | Verify `mysqldump` is installed and DB credentials are correct |

---

## 17. Maintenance

- Review security audit logs weekly
- Test backup restoration monthly
- Update dependencies quarterly
- Rotate secrets annually
- Monitor error rates and performance metrics continuously
