# Bangladesh Army Cybersecurity Awareness Training Platform

Enterprise-grade web application for **authorized internal cybersecurity awareness training**. Educates personnel on phishing, social engineering, fake login pages, QR scams, smishing, vishing, USB risks, password security, and social engineering through realistic but **safe** simulations.

> **Security policy:** This platform **never** collects, stores, or transmits real user credentials. Simulation passwords are discarded client-side and replaced with `********`. The API only records count-based analytics.

![Bangladesh Army](src/assets/Bangladesh_Army.png)

---

## Features

| Area | Status |
|------|--------|
| Military glassmorphism UI (dark green / olive / black / gold) | ✅ |
| Landing page (hero, banner, objectives, modules, stats, progress, CTA) | ✅ |
| Demo training authentication | ✅ |
| 8 interactive training modules | ✅ |
| Safe fake-login simulation (no credential storage) | ✅ |
| Trainee / Instructor / Admin dashboards | ✅ |
| Recharts analytics, risk heatmap, department progress | ✅ |
| Gamification (XP, badges, levels, leaderboard, certificates) | ✅ |
| CSV + printable PDF reports | ✅ |
| High-contrast mode, keyboard nav, skip link | ✅ |
| Express API + PostgreSQL schema | ✅ |
| Docker + Nginx deployment | ✅ |
| API docs & deployment guide | ✅ |

---

## Demo accounts

| Username | Demo password | Role |
|----------|---------------|------|
| `trainee001` | `Train@Demo1` | Trainee |
| `trainee002` | `Train@Demo2` | Trainee |
| `instructor001` | `Instruct@Demo1` | Instructor |
| `admin001` | `Admin@Demo1` | Admin |

External email providers (Gmail, Yahoo, Outlook, …) are **rejected**.

---

## Training modules

1. Email Phishing Awareness  
2. Fake Login Awareness (safe simulation)  
3. QR Phishing Awareness  
4. SMS Phishing (Smishing)  
5. Voice Phishing (Vishing)  
6. USB Security  
7. Password Security  
8. Social Engineering  

---

## Tech stack

**Frontend:** React 19 · TypeScript · Vite · React Router · Recharts · Framer Motion · Lucide  

**Backend:** Node.js · Express · JWT sessions · Helmet · Rate limiting  

**Database:** PostgreSQL 16 (in-memory fallback when `DATABASE_URL` is unset)  

**Deploy:** Docker Compose · Nginx reverse proxy · CSP / security headers  

---

## Quick start (frontend only)

```bash
npm install
npm run dev
```

Open the URL shown (typically `http://localhost:5173`). Works fully offline with local demo auth and `localStorage` progress.

---

## Full stack (API + optional Postgres)

```bash
# API (memory mode — no DB required)
cd server
npm install
npm run dev

# Frontend (new terminal)
cd ..
npm install
npm run dev
```

Vite proxies `/api` → `http://localhost:4000`.

---

## Docker (production-style)

```bash
cp .env.example .env   # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build -d
```

Open **http://localhost**

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for HTTPS, secrets, and production checklist.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/API.md](docs/API.md) | REST API reference |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, bare-metal, TLS |
| [docs/SECURITY.md](docs/SECURITY.md) | Credential safety policy |
| [server/src/db/schema.sql](server/src/db/schema.sql) | PostgreSQL schema |

---

## Project structure

```
army-cyber-training/
├── src/                 # React SPA
│   ├── assets/          # Bangladesh Army logo + images
│   ├── components/
│   ├── context/         # Auth, progress, theme
│   ├── data/            # Modules, demo accounts, sample analytics
│   ├── lib/             # API client, CSV/PDF helpers
│   └── pages/           # Landing, dashboards, 8 modules
├── server/              # Express API
│   └── src/db/          # schema, migrate, seed, memory store
├── nginx/               # SPA + /api reverse proxy
├── docs/                # API, deployment, security
├── Dockerfile
└── docker-compose.yml
```

---

## Security highlights

- Training accounts only — no OAuth / external IdP for end users  
- Fake-login module discards passwords immediately  
- `/api/sim-events` accepts **counts only** (rejects password fields)  
- Parameterized SQL · Helmet · rate limits · audit logs (no secrets)  
- Blocked routes: `/api/phish`, `/api/campaign`, `/api/harvest`, `/api/credentials`  
- CSP and security headers via Nginx  

---

## License / use

**Authorized internal training use only.**  
Classification: Training / Unclassified.  
No offensive phishing capability is provided.

Repository: [Bangladesh-Army-Cybersecurity-Awareness-Training-Platform](https://github.com/mah5472651/Bangladesh-Army-Cybersecurity-Awareness-Training-Platform)
# Bangladesh-Army-Cybersecurity-Awareness-Training-Platform.
