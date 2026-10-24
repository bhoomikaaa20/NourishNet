# NourishNet

Food rescue platform: donors offer surplus food, people in need request it, and admins manage both from a dashboard. Every request and donation gets a tracking code that the submitter can use, together with their email, to follow its status.

- `frontend/`: React (Create React App) site
- `backend/`: Express + MongoDB API

## Backend

```bash
cd backend
cp .env.example .env     # then fill it in (see below)
npm install
npm run dev              # nodemon; `npm start` for production
```

| Variable | Purpose |
|---|---|
| `MONGO_URL` | MongoDB connection string (required) |
| `SECRET_KEY` | JWT signing secret. Generate with `node generate.js` (required) |
| `ADMIN_EMAIL` | Admin login email (required) |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password: `node generate.js hash '<password>'`. Wrap the value in single quotes in `.env`. A plain `ADMIN_PASSWORD` is still accepted but discouraged |
| `CLIENT_ORIGIN` | Comma-separated frontend origins allowed by CORS. If unset, all origins are allowed |
| `PORT` | Defaults to 8087 |

The server refuses to start if a required variable is missing. On startup it gives tracking codes to any older requests and donations that don't have one.

Tests (they need a **local, disposable** MongoDB and drop the database they use):

```bash
TEST_MONGO_URL=mongodb://127.0.0.1:27017/nourishnet_test npm test
```

### API

Public:
- `POST /api/request-food`, `POST /api/donate-food`, `POST /contact` (alias `/api/contact`), `POST /api/connections`, `POST /api/volunteers`
- `GET /api/listings` (`city`, `foodType`, `dietType`): approved, unclaimed, unexpired donations, with no personal data
- `POST /api/listings/:id/claim`: reserves a listing atomically (409 if someone else got it first) and creates a linked food request
- `POST /api/track` (`{ trackingId, email }`), `GET /api/impact` (aggregate numbers), `GET /api/health` (includes DB status)

Admin (`Authorization: Bearer <token>` from `POST /api/auth/login`):
`GET /api/admin/stats` (includes a 14-day trend), `GET /api/admin/:type` (`q`, `status`, `sort`, `page`, `limit`), `GET /api/admin/:type/export` (CSV), `PATCH /api/admin/:type/:id` (`status`, `adminNote`, `releaseClaim`), `DELETE /api/admin/:type/:id`, where `:type` is one of `requests | donations | contacts | volunteers | connections`.

### Donation lifecycle

1. A donor submits food, which starts as **pending** and is not public.
2. An admin marks it **approved**, and it appears on *Find Food* until its "good until" date.
3. Someone reserves it. The listing disappears, and both sides see the reservation on the Track page.
4. The admin coordinates and marks both records **completed**, or releases the reservation to re-list it.

### Deploying to Render

1. In the Render service's **Environment**, set `MONGO_URL` (required), plus `SECRET_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` for admin login. Without the admin variables the public site still works, but admin login returns 503.
2. In MongoDB Atlas, under **Network Access**, allow Render to connect (`0.0.0.0/0`, or Render's outbound IPs).
3. Deploy. `GET /api/health` should return `{"status":"ok","db":"connected"}`.

The old public `GET /api/dashboard` has been removed because it exposed personal data without authentication.

## Frontend

```bash
cd frontend
npm install
echo REACT_APP_API_URL=http://localhost:8087 > .env.local   # optional; defaults to the Render deployment
npm start
```

`npm test` runs the Jest suite, and `npm run build` produces the production bundle.
