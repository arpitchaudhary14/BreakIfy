# BreakIfy Security & Trust Documentation

BreakIfy (`breakify.site`, *Shorten. Track. Share.*) implements enterprise-grade defense-in-depth architecture across all link creation, telemetry ingestion, redirection flows, and account authentication systems.

---

## 1. Threat Model

BreakIfy identifies and defends against the following primary threat vectors:

### A. Phishing & Malware Delivery via Short URLs
* **Threat:** Attackers shorten deceptive URLs targeting high-value institutions (e.g. PayPal, Apple, MetaMask, banking portals) or direct downloads of malicious binaries (`.exe`, `.scr`, `.bat`, `.apk`).
* **Mitigation:**
  - Automated pre-flight inspection via `UrlSafetyService` and `HeuristicUrlPatternProvider`.
  - Brand homoglyph and impersonation heuristics flag non-official domain patterns.
  - Integration interface (`IUrlReputationProvider`) for Google Safe Browsing and commercial reputation APIs.
  - Links flagged as malicious ($\text{riskScore} \ge 70$) are rejected at creation and blocked from redirection.

### B. Open Redirects & CRLF Header Injection
* **Threat:** Attackers exploit redirect query parameters or inject carriage-return line-feed (`\r\n`) characters into destinations to achieve HTTP response splitting or bypass organizational network firewalls.
* **Mitigation:**
  - Strict protocol enforcement: Only `http:` and `https:` schemes are accepted.
  - Stripping of CRLF characters (`\r\n`) prior to sending HTTP 302/307 `Location` headers.
  - Blocking private IP ranges, loopback addresses (`127.0.0.1`, `localhost`), and AWS/GCP cloud metadata endpoints (`169.254.169.254`) to prevent Server-Side Request Forgery (SSRF).

### C. Account Takeover & Credential Stuffing
* **Threat:** Automated bot attacks attempting credential stuffing, brute force logins, or session hijacking.
* **Mitigation:**
  - RFC 6238 compliant Two-Factor Authentication (TOTP) compatible with Google Authenticator, Authy, and 1Password.
  - 10 single-use, cryptographically hashed (`SHA-256`) emergency recovery codes.
  - Dedicated IP rate limiters on `/login` (5 attempts / 15m), `/register` (10 / 1h), `/forgot-password` (5 / 1h), and `/2fa/verify-login` (5 / 10m).
  - Suspicious login detection: Dispatches instant in-app security alerts and audit logs when an unrecognized IP or browser user-agent is recorded.
  - Session revocation: Remote invalidation of specific sessions or all other active sessions across devices.

### D. Denial of Service & API Abuse
* **Threat:** Malicious traffic flooding public link resolution or link generation endpoints.
* **Mitigation:**
  - Granular tiered rate limiting:
    - Link redirection: 600 requests / minute / IP
    - URL generation: 30 creations / minute / user
    - Abuse reporting: 10 reports / hour / IP
    - General REST API: 300 requests / 15m / IP

---

## 2. Cryptographic Standards & Secrets Management

| Component | Standard / Algorithm | Security Rationale |
| :--- | :--- | :--- |
| **Password Storage** | Argon2id (`memoryCost`: 64MB, `timeCost`: 3, `parallelism`: 1) | Memory-hard defense against GPU/ASIC brute-force cracking. |
| **Two-Factor Auth (TOTP)** | RFC 6238 (HMAC-SHA1, 30s period, 6 digits, ±1 window drift) | Universal standard; zero external supply-chain dependencies. |
| **Backup Recovery Codes** | 10 distinct `XXXX-XXXX` codes, hashed with SHA-256 | Single-use consumption prevents replay attacks. |
| **Access Tokens** | Signed JWT (`HS256`, 15-minute expiration) | Short-lived stateless authorization. |
| **Refresh Tokens** | Signed JWT (`HS256`, 7-day expiration, HTTP-Only Cookie) | Strictly stored in HTTP-Only, SameSite=Lax cookies. |
| **Session Tracking** | UUIDv4 per device session, validated against DB on token refresh | Immediate invalidation upon session revocation. |

---

## 3. Known Limitations & Realistic Security Boundaries

> [!WARNING]
> BreakIfy does not claim 100% automated malware or phishing prevention. No heuristic or reputation provider can detect zero-day phishing campaigns instantaneously.

1. **Heuristic Detection Limits:**
   - Heuristics evaluate syntactic indicators (TLD risk, brand lookalikes, double extensions, punycode, embedded auth). Advanced attackers utilizing compromised legitimate domains may not trigger heuristic scores immediately.
2. **Third-Party API Outages:**
   - If external safe-browsing providers experience downtime or rate limits, BreakIfy falls back gracefully to local offline heuristics and records a non-fatal warning in system audit logs.
3. **Dynamic Destination Changes:**
   - A link owner could theoretically redirect their destination server after creation (cloaking). Users can report such links via the public Abuse Reporting endpoint (`POST /api/v1/abuse/report`), prompting immediate administrative review.

---

## 4. Environment Variables & Security Configuration

Ensure the following security keys are properly configured in production `.env`:

```env
# Server & Network
PORT=5000
NODE_ENV=production
CLIENT_URL=https://breakify.site

# Database
MONGODB_URI=mongodb://localhost:27017/breakify

# Cryptographic Keys (Must be 32+ cryptographically random bytes)
JWT_ACCESS_SECRET=your-secure-32-byte-hex-encoded-access-secret
JWT_REFRESH_SECRET=your-secure-32-byte-hex-encoded-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Optional External Safety Provider
GOOGLE_SAFE_BROWSING_API_KEY=your-optional-google-safe-browsing-key

# Email & Security Alerts
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailprovider.com
SMTP_PORT=587
SMTP_USER=notifications@breakify.site
SMTP_PASS=strong-smtp-password
EMAIL_FROM=BreakIfy Security <security@breakify.site>
```

---

## 5. Deployment Security Checklist

When deploying BreakIfy in a production environment:

1. **Enforce HTTPS (TLS 1.3):**
   - Terminate TLS at the reverse proxy (Nginx, Caddy, or Cloudflare).
   - Enable HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`).
2. **Reverse Proxy & Cookie Flags:**
   - Ensure `app.set('trust proxy', 1)` is enabled in `NODE_ENV=production` so client IPs are accurately parsed from `X-Forwarded-For`.
   - All session and refresh cookies must carry `secure: true` and `sameSite: 'lax'`.
3. **MongoDB Production Hardening:**
   - Never expose MongoDB port `27017` to the public internet.
   - Enforce authentication and role-based access control (RBAC) on the `breakify` database.

---

## 6. Incident Handling & Abuse Response Playbook

1. **Abuse Submission:**
   - Abuse reports arrive via `POST /api/v1/abuse/report` from end-users, automated systems, or security researchers.
2. **Automated Triage:**
   - The reported short code is mapped to its internal database link record.
3. **Administrative Moderation:**
   - Administrators review reports at `/api/v1/abuse/reports`.
   - Available moderation actions:
     - `link_suspended`: Changes link status to `inactive`, instantly terminating redirects (HTTP 410 Gone).
     - `link_deleted`: Moves link to the recycle bin.
     - `dismissed`: Marks report as false positive.
4. **Audit Trail:**
   - All moderation actions dispatch immutable records to `ActivityLog` (`category: security`).

