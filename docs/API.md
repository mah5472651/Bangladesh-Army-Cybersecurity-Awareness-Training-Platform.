# API Documentation

**Bangladesh Army Cybersecurity Awareness Training Platform**

Base URL: `/api`  
Auth: `Authorization: Bearer <token>` after login  
Policy: **Never** accepts or stores simulation credentials. Only training demo accounts are valid.

---

## Health

### `GET /api/health`

Public health check.

**Response**
```json
{
  "status": "ok",
  "mode": "postgres | memory",
  "database": "connected | memory-fallback",
  "platform": "Bangladesh Army Cybersecurity Awareness Training Platform",
  "policy": "Training-only. Never stores simulation credentials."
}
```

---

## Authentication

### `POST /api/auth/login`

Training-account login only. External email domains are rejected.

**Body**
```json
{ "username": "trainee001", "password": "Train@Demo1" }
```

**Success `200`**
```json
{
  "token": "<jwt>",
  "user": {
    "username": "trainee001",
    "displayName": "Corporal Rahman",
    "rank": "Cpl",
    "unit": "Signals Battalion",
    "role": "trainee",
    "department": "Signals"
  }
}
```

**Errors**
- `401` invalid demo credentials  
- `403` external email / non-training account  

### `POST /api/auth/logout`

Requires auth. Invalidates server session.

### `GET /api/auth/me`

Requires auth. Returns current user identity (no password fields).

---

## Progress

### `GET /api/progress`

Requires auth. Returns module progress, XP, badges, and simulation event count.

### `POST /api/progress`

Requires auth.

**Body**
```json
{ "moduleId": "email-phishing", "score": 90, "completed": true }
```

`moduleId` must be one of the eight curriculum modules.  
**Never** send passwords in this endpoint.

---

## Simulation Events (counts only)

### `POST /api/sim-events`

Requires auth. Records **click** or **form_attempt** counts for instructor analytics.

**Body**
```json
{ "kind": "form_attempt", "moduleId": "fake-login" }
```

Any credential-like fields (`password`, `username`, `otp`, etc.) are **rejected with 400**.

---

## Instructor

### `GET /api/instructor/stats`

Requires role `instructor` or `admin`.

Returns:
- trainee participation  
- completed modules / quiz scores  
- click rates on simulated content  
- form submission **attempt counts only**  
- overall awareness scores  
- department progress  
- risk heatmap  
- awareness trends  

No passwords or sensitive inputs are included.

---

## Admin

### `GET /api/admin/stats`

Requires role `admin`.

Returns user directory, recent audit logs (action names only — never passwords), and platform summary counts.

---

## Gamification

### `GET /api/gamification/leaderboard`

Requires auth. XP-based leaderboard for trainees.

---

## Explicitly blocked routes

The following paths always return `403`:

- `/api/phish`
- `/api/campaign`
- `/api/harvest`
- `/api/credentials`

Offensive phishing / credential harvesting is prohibited.

---

## Rate limiting

- Global: 400 requests / 15 minutes / IP  
- Login: 30 attempts / 15 minutes / IP  

---

## Demo accounts

| Username | Demo password | Role |
|----------|---------------|------|
| trainee001 | Train@Demo1 | trainee |
| trainee002 | Train@Demo2 | trainee |
| instructor001 | Instruct@Demo1 | instructor |
| admin001 | Admin@Demo1 | admin |
