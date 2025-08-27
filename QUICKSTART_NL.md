# Quickstart (NL)

Ultra kort voor lokaal ontwikkelen.

1. Dependencies installeren
```
npm install
```

2. .env aanmaken (kopieer `.env.example` -> `.env` en vul minimaal):
```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=partijtrade
JWT_SECRET=ietsLangRandom
```
(Optional) `ENABLE_CSP=1` voor basis CSP.

3. Start backend
```
npm run start:server
```
Log toont: `Server draait op http://localhost:4000`.

4. Start frontend (2e terminal)
```
npm start
```
Frontend opent (poort kan 3000 of 4001 zijn). API gaat naar 4000.

5. Inloggen (admin default)
Gebruiker: `admin`  Wachtwoord: `admin123` (verander snel in profiel / via first-password als mustChange actief wordt gezet).

6. Belangrijkste endpoints
- `POST /auth/login` (inlog + JWT)
- `POST /auth/refresh` (token vernieuwing)
- `GET /auth/me` (huidige user)
- `GET /healthz` (uptime check)

7. Wachtwoord policy
Min 8 chars + letter + cijfer (server & frontend enforced bij wijziging/reset/first).

8. Uploads
Bestanden via `/uploads/...` (limieten & eventuele Redis rate limiting). 

9. Problemen snel oplossen
- Poort bezet: wijzig `PORT` in `.env` of sluit oud proces.
- CORS fout: check dat backend draait op 4000.
- Token issues: verwijder `auth_token_v1` uit localStorage en login opnieuw.

10. Veiligheid
Helmet actief. Rate limiting op login & reset. Disabled gebruiker => 403.

Klaar. Voor details zie `README.md`.
