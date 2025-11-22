# TinyLink - Node + Express
**Project produced for the TinyLink take-home assignment.**

## What I built
- Node.js + Express server implementing a tiny link service (create, list, stats, delete, redirect).
- Endpoints:
  - `GET /healthz` - health check
  - `POST /api/links` - create a link (body: `{ url, code?, title? }`)
  - `GET /api/links` - list links
  - `GET /api/links/:code` - get link metadata
  - `DELETE /api/links/:code` - soft-delete a link
  - `GET /code/:code` - basic stats page (HTML)
  - `GET /:code` - redirect (302) to the target url (if not deleted)

## Code rules enforced
- `code` must match `/^[A-Za-z0-9](6, 8)$/`
- Redirect increments `clicks` and updates `last_clicked_at`
- Delete sets `deleted = true` and redirects return 404 for deleted codes

## Files included
- `index.js` - main server
- `package.json`
- `.env.example`
- `migrations/001_create_links.sql` - SQL to create the required table
- `README.md`

## Database (Postgres)
Use the SQL migration to create the `links` table:

```sql
-- migrations/001_create_links.sql
CREATE TABLE IF NOT EXISTS links (
  code varchar(8) PRIMARY KEY,
  url text NOT NULL,
  title text,
  clicks integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_clicked_at timestamptz,
  deleted boolean DEFAULT false NOT NULL
);
```

## Run locally
1. `cd tinylink-node-express`
2. `npm install`
3. Create a `.env` file (copy `.env.example`) and set `DATABASE_URL` if you want persistence.
4. If using Postgres, run the SQL in `migrations/001_create_links.sql` against your DB.
5. `npm start`
6. Open `http://localhost:3000`

## Notes
- If `DATABASE_URL` is not set, the app will use an in-memory store (data will be lost on restart).
- I used the assignment PDF available at: `/mnt/data/Take-Home Assignment_ TinyLink (1) (2).pdf` as the spec reference.
