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
| `SECRET_KEY` | JWT signing secret for every sign-in (users and admins). Generate with `node generate.js` (required) |
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

Sign-in is optional for the public endpoints. When a valid session token is sent, donations, requests, claims and volunteer sign-ups are linked to that account.

Auth: `POST /api/auth/register` (`name`, `email`, `password`, optional `phone`, `city`; always creates a `user`), `POST /api/auth/login`, `GET /api/auth/me`. Responses include `user.role` and `user.permissions`.

Signed-in user (`Authorization: Bearer <token>`):
`GET|PATCH /api/me` (name, phone, city), `POST /api/me/password` (`currentPassword`, `newPassword`; signs out other sessions), `GET /api/me/donations`, `GET /api/me/requests`, `DELETE /api/me/:type/:id` (withdraw your own submission while it is still pending and unreserved).

Admin:
`GET /api/admin/stats` (includes a 14-day trend), `GET /api/admin/:type` (`q`, `status`, `sort`, `page`, `limit`), `GET /api/admin/:type/export` (CSV), `PATCH /api/admin/:type/:id` (`status`, `adminNote`, `releaseClaim`), `DELETE /api/admin/:type/:id`, where `:type` is one of `requests | donations | contacts | volunteers | connections`.
Users: `GET /api/admin/users` (`q`, `status`, `role`, …), `GET /api/admin/users/export`, `PATCH /api/admin/users/:id` (`role`, `status: active | suspended`), `DELETE /api/admin/users/:id` (the user's submissions are kept but unlinked).

### Roles and permissions

Permissions are defined in [backend/rbac.js](backend/rbac.js). Routes check permissions, not role names.

| Permission | user | admin |
|---|:-:|:-:|
| `profile:read`, `profile:update`: own profile and password | ✓ | ✓ |
| `submissions:own:read`: own donations and requests | ✓ | ✓ |
| `submissions:own:cancel`: withdraw own *pending* submissions | ✓ | ✓ |
| `dashboard:read`: stats and trends | | ✓ |
| `submissions:read` / `update` / `delete` / `export`: all records | | ✓ |
| `users:read` / `update` / `delete`: manage accounts and roles | | ✓ |

- No session gets **401**. A session without the permission gets **403**. Another user's record gets **404**, because ownership is part of the query.
- Self-registration always creates a `user`. Admins are appointed by an admin on the dashboard's **Users** tab, or with `node generate.js promote <email> [admin|user]`.
- Role and status are read from the database on every request, so promotions, demotions and suspensions take effect immediately.
- Admins can't change or delete their own account, and the last active admin can't be removed.
- Every account, admins included, is a MongoDB user. There is no environment-variable admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_PASSWORD_HASH` are ignored.
- Submissions are linked only by the verified session, never by email. Anonymous submissions made before an account existed are not shown under *My account*. They can still be followed with the tracking code.

### Donation lifecycle

1. A donor submits food, which starts as **pending** and is not public.
2. An admin marks it **approved**, and it appears on *Find Food* until its "good until" date.
3. Someone reserves it. The listing disappears, and both sides see the reservation on the Track page.
4. The admin coordinates and marks both records **completed**, or releases the reservation to re-list it.

### Deploying to Render

1. In the Render service's **Environment**, set `MONGO_URL` (required), `SECRET_KEY` (required for sign-in) and `CLIENT_ORIGIN` (your frontend URL). Without `SECRET_KEY` the public site still works, but sign-in returns 503.
2. In MongoDB Atlas, under **Network Access**, allow Render to connect (`0.0.0.0/0`, or Render's outbound IPs). If you skip this, startup fails with "Could not connect to any servers in your MongoDB Atlas cluster".
3. Deploy. `GET /api/health` should return `{"status":"ok","db":"connected"}`.
4. Create the first admin: register on the site, then on your own machine run `MONGO_URL='<same url>' node generate.js promote <email>` from `backend/`. Your IP must also be allowed in Atlas. Sign out and back in.

The old public `GET /api/dashboard` has been removed because it exposed personal data without authentication.

## Frontend

```bash
cd frontend
npm install
echo REACT_APP_API_URL=http://localhost:8087 > .env.local   # optional; defaults to the Render deployment
npm start
```

`npm test` runs the Jest suite, and `npm run build` produces the production bundle.
