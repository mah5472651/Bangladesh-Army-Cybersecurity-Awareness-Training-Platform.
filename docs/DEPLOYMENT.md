# Deployment Guide

**Bangladesh Army Cybersecurity Awareness Training Platform**

Authorized internal cybersecurity awareness training only. Deploy on controlled networks. Do not expose to the public internet without additional hardening and access control.

---

## Architecture

```
Browser  →  Nginx (:80)  →  Static SPA (React/Vite)
                 │
                 └─ /api/*  →  Express API (:4000)  →  PostgreSQL (:5432)
```

---

## Prerequisites

- Docker Engine 24+ and Docker Compose v2  
- Or: Node.js 20+, PostgreSQL 16+ for bare-metal  

---

## Quick start (Docker)

```bash
cd army-cyber-training

# Optional: configure secrets
cp .env.example .env
# edit POSTGRES_PASSWORD and JWT_SECRET

docker compose up --build -d
```

Open **http://localhost**

Seed job (`api-init`) applies schema and loads demo training accounts.

### Useful commands

```bash
docker compose ps
docker compose logs -f api
docker compose down
docker compose down -v   # also remove DB volume
```

---

## Local development

### Frontend only (offline-capable)

```bash
npm install
npm run dev
```

Frontend uses `localStorage` / session when the API is offline.

### Frontend + API (memory store)

```bash
# terminal 1
cd server && npm install && npm run dev

# terminal 2
npm install && npm run dev
```

Set in frontend env (optional):

```
VITE_API_URL=http://localhost:4000/api
```

Without `DATABASE_URL`, the API runs in **memory mode** with the same demo accounts.

### Frontend + API + PostgreSQL

```bash
# start Postgres (example)
docker run --name ba-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_USER=ba_cyber \
  -e POSTGRES_DB=ba_cyber_training -p 5432:5432 -d postgres:16-alpine

export DATABASE_URL=postgres://ba_cyber:dev@localhost:5432/ba_cyber_training
export JWT_SECRET=dev-secret

cd server
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Production checklist

1. **Change secrets** — `POSTGRES_PASSWORD`, `JWT_SECRET`  
2. **HTTPS** — terminate TLS at a reverse proxy / load balancer (Nginx, Traefik, or cloud LB) and forward to the `web` service  
3. **Network** — restrict access to authorized personnel (VPN, IP allowlist, SSO gateway)  
4. **CORS** — set `CORS_ORIGINS` to the real origin only  
5. **Backups** — schedule PostgreSQL backups; never back up simulation “credentials” (they are not stored)  
6. **Updates** — rebuild images after dependency updates  
7. **Audit** — review `/api/admin/stats` audit trail regularly  

### Example TLS with external Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name cyber-training.army.internal;
  ssl_certificate     /etc/ssl/certs/training.crt;
  ssl_certificate_key /etc/ssl/private/training.key;

  location / {
    proxy_pass http://127.0.0.1:80;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## Security controls delivered

| Control | Implementation |
|---------|----------------|
| HTTPS | Terminate at edge proxy (documented) |
| CSP | Nginx `Content-Security-Policy` header |
| CSRF | Stateless JWT + same-site SPA; no cookie session for API |
| XSS | React escaping + CSP |
| SQLi | Parameterized `pg` queries |
| Rate limiting | `express-rate-limit` on API + login |
| Audit logs | Login/logout actions (no passwords) |
| Session management | JWT + server-side session table with expiry |
| Credential safety | Simulation passwords never accepted/stored by API |

---

## Demo accounts (training only)

| Username | Password | Role |
|----------|----------|------|
| trainee001 | Train@Demo1 | Trainee |
| trainee002 | Train@Demo2 | Trainee |
| instructor001 | Instruct@Demo1 | Instructor |
| admin001 | Admin@Demo1 | Admin |

---

## Health check

```bash
curl http://localhost/api/health
```

---

## Uninstall

```bash
docker compose down -v
```
