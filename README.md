## ImpexDeals – Dev Setup

Full‑stack: React (CRA + TypeScript) frontend en Express/MySQL backend (zelfde repo). In development draaien frontend en backend op verschillende poorten.

### 1. Vereisten
- Node 18+
- MySQL server (lokaal) met database `partijtrade` (of pas aan via `.env`).

### 2. .env aanmaken
Kopieer `.env.example` naar `.env` en vul ten minste:
```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=partijtrade
JWT_SECRET=vervang_dit
```
Optioneel: `ENABLE_CSP=1` om basis Content Security Policy te activeren.

Frontend build-time variabelen (alleen REACT_APP_ worden meegenomen):
```
REACT_APP_API_BASE=http://localhost:4000
```

### 3. Installatie
```
npm install
```

### 4. Starten (dev)
Backend:
```
npm run start:server
```
Frontend (in tweede terminal):
```
npm start
```
Frontend kiest vrije poort (bv. 3000/4001); API calls gaan naar `http://localhost:4000` via centrale `apiClient`.

### 5. Authenticatie
- Endpoint: `POST /auth/login` body `{ usernameOrEmail, password }`
- Token (JWT) wordt opgeslagen in `localStorage` onder `auth_token_v1`.
- Automatische refresh: `/auth/refresh` via hook `useAuthRefresh` (ongeveer elke 7 uur).
- Verplicht nieuw wachtwoord: user veld `mustChange` triggert redirect naar `/first-password`.

### 6. Wachtwoord policy
Server enforced bij change/reset/first: minimaal 8 tekens, bevat letter + cijfer. Zelfde checks op frontend registratie en first-password.

### 7. Security
- Helmet actief (basis headers).
- Optionele CSP (zet `ENABLE_CSP=1`). Default directives beperken scripts/styles/images tot eigen origin.
- Rate limiting: login & reset endpoints (`LOGIN_MAX` / `LOGIN_WINDOW_MS`).
- Disabled users krijgen `403 { error:"disabled" }` bij login/refresh.

### 8. Health & Monitoring
`GET /healthz` → `{ ok:true, uptime, ts, dbPoolActive }` voor uptime checks / load balancer.

### 9. Images & Uploads
- Upload pad: `/uploads` (lokale disk). Rate limit per user (fallback memory of Redis indien ingeschakeld).
- Legacy base64 migratie script kan automatisch draaien (zie `MIGRATE_BASE64_ON_START`).

### 10. Productie build
```
npm run build
```
`build/` wordt door Express geserveerd wanneer aanwezig. Daarna kun je backend alleen draaien (frontend aparte dev server niet nodig).

### 11. Belangrijke scripts
| Script | Doel |
| ------ | ---- |
| `npm start` | Frontend dev server |
| `npm run start:server` | Backend API server |
| `npm run build` | Frontend productie build |

### 12. Veelvoorkomende problemen
- Poort 4000 bezet → zoek proces: `Get-NetTCPConnection -LocalPort 4000` (PowerShell), kill of wijzig `PORT`.
- CORS fout → controleer dat frontend origin matcht (localhost poort toegestaan) en server draait.
- Login 200 maar geen user → controleer token & `/auth/me`. (Fallback logic aanwezig.)

### 13. Uitbreiding ideeën
- Sterkere CSP met specifieke externe bronnen.
- Audit logging tabel (user actions).
- Zoek-index optimalisatie (fulltext).

### 14. License
Interne projectdocumentatie – geen publieke licentie ingesteld.

