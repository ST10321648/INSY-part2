# INSY-part2 — Secure Payments Demo

A small full-stack app that demonstrates a secure payments workflow:

- **Frontend:** React (CRA) with a simple login/register screen and a payments form + history.
- **Backend:** Node.js/Express, SQLite, JWT auth (access + refresh), CSRF protection, Helmet/CSP, rate-limits and account lockout.
- **Dev security:** Local HTTPS (mkcert), strict cookies, CORS allow-list.
- **Tests:** Node’s built-in test runner + Supertest (integration flow).
- **CI:** GitHub Actions (install → test → audit).

Repo layout (top level):
```
INSY-part2/
  backend/
  frontend/
  .github/workflows/ci.yml
```
The repository contains `backend` and `frontend` folders as shown on GitHub.

---

## 1) Prerequisites

- **Node.js 20+** and **npm**
- **mkcert** for local HTTPS  
  - Windows: `scoop install mkcert` (or Chocolatey)  
  - macOS: `brew install mkcert nss`  
  - Linux: install mkcert and trust the local CA for your distro

---

## 2) Backend — setup & run (HTTPS)

```bash
cd backend
npm install
```

Generate local TLS certs (once):

```bash
mkdir -p certs
mkcert -install
mkcert -key-file ./certs/localhost-key.pem -cert-file ./certs/localhost.pem localhost
```

Create **`backend/.env`**:

```dotenv
# server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=https://localhost:3000,https://localhost:3002,https://localhost:5173

# jwt
JWT_ACCESS_SECRET=dev_access_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# lockout policy
LOCKOUT_MAX_ATTEMPTS=5
LOCKOUT_WINDOW_MINUTES=15

# https certs
TLS_KEY=./certs/localhost-key.pem
TLS_CERT=./certs/localhost.pem
```

Start the API (dev):

```bash
npm run dev
```

You should see: **HTTPS API listening on https://localhost:5000**.

---

## 3) Frontend — setup & run (CRA)

```bash
cd frontend
npm install
```

Create **`frontend/.env.development`**:

```dotenv
HTTPS=true
SSL_CRT_FILE=..\backend\certs\localhost.pem
SSL_KEY_FILE=..\backend\certs\localhost-key.pem
PORT=3000
REACT_APP_API_BASE=https://localhost:5000
```

Run the app:

```bash
npm start
```

Open **https://localhost:3000**  
Navigate to **/login** → Register (email + strong password) → **/payments** to submit and view history.

---

## 4) Tests (backend)

The backend uses Node’s test runner + Supertest.

```bash
cd backend
npm test
```

Notes:
- Tests use a **non-secure CSRF cookie** in `NODE_ENV=test` so Supertest works.
- The DB connection is memoized and uses a **test file DB** (`./test.sqlite`) so data persists across requests in a run.
- If you want a clean slate, delete `backend/test.sqlite` and re-run.

---

## 5) Security features (summary)

- **HTTPS in dev** via mkcert; strict cookies (`HttpOnly`, `SameSite=Strict`, `Secure` where appropriate).
- **JWT** access + refresh flow; refresh token stored as an HttpOnly cookie.
- **CSRF** protection (cookie-based token) and **CORS** allow-list.
- **Helmet** (CSP, Referrer-Policy) + basic **XSS/inputs validation**.
- **Rate-limits** on auth and payments; **account lockout** on repeated failures.
- **SQLite** with parameterized queries.

Production tips:
- Put secrets in a secret manager and rotate regularly.
- Use Postgres/MySQL with migrations.
- Terminate TLS at a reverse proxy (nginx/Traefik) and enable **HSTS**.

---

## 6) Continuous Integration (GitHub Actions)

A workflow at **`.github/workflows/ci.yml`** runs on every push/PR:

- Set up Node
- Install backend dependencies
- Run backend tests
- Run `npm audit` (high+)

Add a badge to the top of this README once you push the workflow:

```md
![CI](https://github.com/ST10321648/INSY-part2/actions/workflows/ci.yml/badge.svg)
```

---

## 7) Troubleshooting

**“react-scripts not recognized”**  
Run `npm install` in `frontend`. Ensure `package.json` has `"react-scripts": "5.x"` and `"start": "react-scripts start"`.

**Windows `NODE_ENV` errors**  
Scripts use `cross-env`. If you see issues, reinstall dev deps: `cd backend && npm i -D cross-env`.

**Port in use (EADDRINUSE: 5000/3000)**  
Stop other dev servers or change `PORT` in `.env` and update `REACT_APP_API_BASE`.

**CSRF/CORS failures**  
Ensure frontend’s API base matches backend, and CORS origins are set.

**Certificate warnings**  
Visit `https://localhost:5000/api/csrf-token` once in browser to trust the cert.

---

## 8) Scripts

**Backend**
- `npm run dev` — start API (HTTPS)
- `npm test` — run integration tests
- `npm start` — production mode

**Frontend**
- `npm start` — run CRA dev server (HTTPS)
- `npm run build` — build static assets

---


### Credits

Built as part of the INSY Part 2 coursework.
