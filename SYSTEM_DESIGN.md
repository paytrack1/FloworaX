# FloworaX — System Design v2

Target stack: **React (Vite) frontend · Express backend · MongoDB Atlas · Render deploy · Cloudflare**

## Current architecture (what exists today)

```
[ Browser ]
     │  HTTPS
     ▼
[ Frontend: floworax.pxxl.run / Vercel ]  ← static assets, already CDN-backed by the host
     │  fetch() /api/*
     ▼
[ Backend: single Express instance on Render ]   (index.js monolith, ~52 KB)
     │
     ├── MongoDB Atlas (single connection string, default pool)
     ├── In-memory rate limiting (express-rate-limit, default MemoryStore)
     ├── node-cron + automationScheduler (runs inside the web process)
     └── Resend / Africa's Talking / Twilio (external APIs)
```

### Problems with the current design
1. **Everything in one process.** Rate limiting, cron jobs, automation scheduler and the
   web server all share one Node process. This breaks the moment you have >1 instance
   (Render auto-scaling or a restart mid-job → duplicated reminders, wrong rate limits).
2. **In-memory state is a single-instance trap.** MemoryStore rate limits reset on every
   deploy/restart and don't count across replicas.
3. **Default MongoDB pool.** No `maxPoolSize` tuning, no timeouts, no retry handling.
4. **No cache layer.** Dashboard, plans, and every `/api/auth/me` hit MongoDB directly.
5. **Secrets live in plaintext `.env` files** (Mongo password, Paystack, Resend, JWT).
   These must be rotated and moved to host env vars / a secret manager.

---

## Target architecture (v2)

```
                         ┌─────────────────────────────┐
                         │            CDN              │
                         │  (Vercel edge for frontend  │
                         │   + optional Cloudflare)    │
                         └──────────────┬──────────────┘
                                        │  cache: static assets, /api/plans
                                        ▼
                         ┌─────────────────────────────┐
                         │      LOAD BALANCER          │
                         │  (Render LB / Cloudflare)   │
                         └──────────────┬──────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                  [API instance]  [API instance]  [API instance]   ← stateless Express
                        └───────┬───────┴───────────────┘
                                │
              ┌─────────────────┼──────────────────────┐
              ▼                 ▼                      ▼
        [Redis]           [MongoDB Atlas]        [Worker process]
   rate limiting        connection pooling       cron + automation
   session/OTP cache    maxPoolSize tuned        (separate service on Render)
   dashboard cache
```

### 1. CDN (in front of the frontend)
- **Vercel already gives you this** — hashed static assets are edge-cached.
- Optional: put **Cloudflare** in front for WAF, bot filtering and DDoS protection.
  Point `app.floworax.com` at Cloudflare → Vercel.
- Do **not** cache: any `/api/*` except `GET /api/plans` (Cache-Control: public, max-age=300).

### 2. Load balancer (in front of the backend)
- On Render: scale the web service to **2+ instances**; Render's LB handles distribution.
- **Prerequisite: the API must be stateless.** Today it isn't, because:
  - rate limiting is in-memory → move to Redis (below)
  - cron/scheduler runs in-process → move to a worker (below)
- After that, instances are interchangeable and the LB can kill/restart any of them safely.
- Set `app.set('trust proxy', N)` correctly if you add Cloudflare (extra hop): use
  `trust proxy = true` with Cloudflare's IP ranges, or rate limits will count Cloudflare's IP.

### 3. Redis (the piece that makes everything else work)
One Redis instance (Upstash/Render Redis), used for three jobs:

| Use | Replaces | How |
|---|---|---|
| Rate limiting | MemoryStore | `rate-limit-redis` adapter + `ioredis` |
| OTP / reset-token caching | direct Mongo writes | short-TTL keys (`otp:<userId>` 10 min) |
| Dashboard/plan caching | repeated Mongo queries | `cache-aside`, TTL 30–60 s, invalidate on write |

Also the natural home later for: BullMQ job queue (emails/SMS retries), presence, and
stale-while-revalidate for reports.

### 4. MongoDB Atlas + connection pooling
MongoDB drivers pool by default — you don't add a separate "pooler" like PgBouncer; you
**tune the driver's pool** in `mongoose.connect`:

```js
await mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,          // per instance; keep instances × 50 < Atlas tier max
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 60000,
});
```

If you later outgrow the model tier's connection limit, put **Atlas Connection Pooling
(via Atlas Private Endpoint / Global Document API)** or a sidecar pooling proxy in front
— but tuning `maxPoolSize` first is the 90 % fix.

### 5. Worker process (separate from the API)
Move `node-cron` + `automationScheduler` out of `index.js` into `worker.js`:
- Render: deploy the same repo as a second service, start command `node worker.js`.
- Cron/automation then runs exactly once regardless of how many API instances exist.
- The worker talks to the same Redis (queue) + Atlas.

### 6. Login/signup flow in the target design
- Auth itself is already JWT + bcrypt — keep it.
- OTP storage moves from Mongo to Redis (`SETEX otp:<userId> 600 hash`, 6-digit code,
  max 5 attempts, constant-time compare) — faster and self-expiring.
- Rate limiting becomes Redis-backed so it survives deploys and works across replicas.
- `emailVerified` should gate write operations (or login) if you want verification to
  actually mean something — currently anyone can skip verification and keep using the app.

---

## Priority-ordered action list

1. **NOW — rotate every secret** (Mongo user password, Paystack, Resend, Gmail app
   password, JWT). They are sitting in plaintext `.env` files. Move real values into
   Render/Vercel env vars.
2. **NOW — deploy the four bug fixes** (session-kill on verify, wrong admin endpoint,
   password-hint mismatch, duplicate-email race).
3. **This week:** add Redis → Redis-backed rate limiter + dashboard/plans cache.
4. **This week:** tune `maxPoolSize` + timeouts in `mongoose.connect`.
5. **Next:** split `worker.js` out of the monolith; scale API to 2 instances.
6. **Next:** Cloudflare in front (WAF + `trust proxy` fix), gate actions on emailVerified.
7. **Later:** split `index.js` (52 KB monolith) into route modules matching `src/routes/`,
   short JWT access tokens + refresh tokens, structured logging.
