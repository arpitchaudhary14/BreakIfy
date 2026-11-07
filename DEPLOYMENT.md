# BreakIfy Production Deployment Guide

This guide details the complete deployment process for BreakIfy (`breakify.site`, *Shorten. Track. Share.*).

---

## 1. Domain & DNS Requirements

Do not assume a registered domain is automatically routed. Configure the following DNS records with your registrar or DNS provider (e.g. Cloudflare, Namecheap, Route 53):

| Type | Name / Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **A** or **CNAME** | `@` (`breakify.site`) | Frontend Host / Edge IP | Main application SPA & short link redirects |
| **CNAME** | `www` | `breakify.site` | Canonical web alias |
| **A** or **CNAME** | `api` (`api.breakify.site`) | Backend Cluster / Server IP | REST API endpoints |
| **TXT** | `@` | `v=spf1 include:... ~all` | SPF email verification record |
| **CNAME** | `_dmarc` | Target provided by email host | DMARC security policy |

### SSL / HTTPS Configuration
* Enforce **TLS 1.3** and minimum TLS 1.2.
* Use Let's Encrypt via Certbot, or utilize Cloudflare SSL (Full / Strict mode).
* Add HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.

---

## 2. Infrastructure Hosting Options

### Option A: Fully Containerized (Docker Compose)
Ideal for Virtual Private Servers (VPS) such as DigitalOcean Droplet, Hetzner, AWS EC2, or Linode:

1. Clone repository to `/var/www/breakify`:
   ```bash
   git clone https://github.com/your-org/breakify.git /var/www/breakify
   cd /var/www/breakify
   ```
2. Configure `.env`:
   ```bash
   cp server/.env.example server/.env
   # Populate secrets (see section 4)
   ```
3. Run with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
   * *Note: MongoDB runs inside the private bridge network (`breakify-net`) without exposing port 27017 to the host.*

### Option B: Cloud PaaS Deployment
* **Frontend SPA:** Deploy `/client` to Cloudflare Pages, Vercel, or Netlify:
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Single Page App Rewrite: `/*` -> `/index.html` (200)
* **Backend API:** Deploy `/server` to Railway, Render, Fly.io, or Heroku:
  - Environment: `Node.js`
  - Build Command: `npm run build`
  - Start Command: `node dist/server.js`
* **Managed Database:** MongoDB Atlas (M0 Free Tier or M10 Production Tier):
  - Add backend server IP to MongoDB Atlas Network Access whitelist.
  - Obtain URI: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/breakify?retryWrites=true&w=majority`.

---

## 3. Google OAuth 2.0 Setup

If using Google One-Tap or Sign-in with Google:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Create **OAuth 2.0 Client ID** (Web application).
3. Set **Authorized JavaScript origins**:
   - `https://breakify.site`
   - `http://localhost:5173` (development)
4. Set **Authorized redirect URIs**:
   - `https://breakify.site/auth/google/callback`
   - `https://api.breakify.site/api/v1/auth/google`
5. Copy Client ID and Client Secret into server `.env`.

---

## 4. Production Environment Variables Checklist

Ensure these variables are exported in your production environment:

```env
# Server
PORT=5000
NODE_ENV=production
API_PREFIX=/api/v1
CLIENT_URL=https://breakify.site

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/breakify?retryWrites=true&w=majority

# JWT Cryptographic Secrets (Minimum 32 random characters)
JWT_ACCESS_SECRET=e7b419c8f12a4b89d816f19a0e69882987a0c91e3e782bcfb40097c27183e8fa
JWT_REFRESH_SECRET=7f9104b9c1d0928e46b9a897210f924719b26580f12c8e174b88936ef01827b1
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Transactional Email (Resend / SendGrid / Postmark / Amazon SES)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
EMAIL_FROM=BreakIfy Security <security@breakify.site>

# Safety & Threat Intelligence (Optional)
GOOGLE_SAFE_BROWSING_API_KEY=
```

---

## 5. Reverse Proxy Nginx Configuration (Standalone)

When running backend and frontend behind an existing host Nginx server:

```nginx
server {
    server_name breakify.site www.breakify.site;
    listen 443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/breakify.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/breakify.site/privkey.pem;

    # Forward API requests
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Short code resolution (e.g. breakify.site/promo2026)
    location ~ ^/([a-zA-Z0-9_-]{3,30})$ {
        proxy_pass http://127.0.0.1:5000/$1$is_args$args;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static SPA assets
    location / {
        root /var/www/breakify/client/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 6. Zero-Downtime Rollout Checklist

- [ ] Database indexes generated on startup (`UserSchema`, `LinkSchema`, `ClickEventSchema`).
- [ ] Rate limits monitored to ensure legitimate spikes are not blocked.
- [ ] Log rotation enabled (`winston` or Docker daemon logging limit `max-size: 50m`).
- [ ] Health check endpoint (`GET /api/v1/health`) verified with monitoring tool (e.g. UptimeRobot, Datadog).
- [ ] Backup recovery codes verified in staging environment.

