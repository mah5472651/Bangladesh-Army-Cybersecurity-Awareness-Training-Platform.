# Security Policy

**Bangladesh Army Cybersecurity Awareness Training Platform**

## Purpose

This platform is an **authorized cybersecurity awareness training** system. It educates personnel through safe simulations of phishing and social engineering. It must **never** be used to conduct real phishing attacks or capture real credentials.

## Non-negotiable rules

1. **Never collect, store, or transmit real user credentials** from simulation forms.  
2. **Never export passwords.**  
3. **Never log passwords.**  
4. **Never build offensive phishing campaigns** against real users.  
5. Training authentication uses **demo accounts only**.  

## How the Fake Login module is safe

1. User types into a **simulated** form in the browser.  
2. On submit, the password is immediately replaced with `********` in UI state.  
3. React state is cleared — raw password is discarded.  
4. Only a **count** (`form_attempt`) may be sent to the API.  
5. API rejects any body containing credential-like keys on `/sim-events` and non-login routes.  
6. Educational warning signs are shown.

## Authentication model

- Demo usernames: `trainee001`, `trainee002`, `instructor001`, `admin001`  
- External providers (Gmail, Yahoo, Outlook, etc.) are rejected client- and server-side  
- Sessions store identity only — never the password  
- Demo passwords are bcrypt-hashed at rest in PostgreSQL  

## Data classification

| Data | Stored? |
|------|---------|
| Training username / rank / unit | Yes |
| Module scores & completion | Yes |
| Simulation click / form **counts** | Yes |
| Simulation typed passwords | **Never** |
| Real personal emails | **Rejected** |

## Reporting issues

Report security concerns through your unit cyber defence channel. Do not use this platform to test live production systems without authorization.
