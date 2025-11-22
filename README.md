# 🔗 TinyLink – Node + Express

**This project was built as part of the TinyLink take-home assignment.**  
It implements a complete URL shortener system with a dashboard, stats page, redirect logic, and PostgreSQL persistence.

---

## 🚀 Live Demo

https://tinylink-node-express.onrender.com/

---

## 📌 What I Built

A complete TinyLink service using **Node.js**, **Express**, **PostgreSQL**, and a **Tailwind CSS UI**.

### ✔ Core Features

- Create short links with auto-generated or custom codes (6–8 characters)
- View links in a dashboard (latest first)
- Redirect using short code (`/:code`)
- Track clicks & last clicked time
- View stats in a dedicated stats page (`/code/:code`)
- Soft delete links (cannot be recreated)
- Prevent reuse of deleted codes
- PostgreSQL-backed storage with fallback to in-memory for local runs

---

## 🔥 Endpoints Implemented

| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| GET    | `/healthz`         | Health check                   |
| POST   | `/api/links`       | Create a new tiny link         |
| GET    | `/api/links`       | List all links                 |
| GET    | `/api/links/:code` | Get metadata for one link      |
| DELETE | `/api/links/:code` | Soft-delete a link             |
| GET    | `/code/:code`      | Show stats page (HTML)         |
| GET    | `/:code`           | Redirect (302) to original URL |

---

## 🧩 Code Rules Enforced

- `code` must match:

  ```
  /^[A-Za-z0-9]{6,8}$/
  ```

- Redirect:

  - increments `clicks`
  - updates `last_clicked_at`

- Deleted links:
  - redirect returns **404**
  - `/api/links` hides deleted links
  - cannot be recreated again

---

## 📂 Files Included

```
index.js                     # Main server
public/                      # Tailwind UI + dashboard
  ├── app.js
  └── index.html
package.json
README.md
.env
```

---

## 🗄 Database (PostgreSQL)

Run this SQL to create the required table:

```sql
CREATE TABLE IF NOT EXISTS links (
  code VARCHAR(8) PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  clicks INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_clicked_at TIMESTAMPTZ,
  deleted BOOLEAN DEFAULT FALSE NOT NULL
);
```

---

## ▶️ Run Locally

1. Clone repo
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create `.env` from the example:

   ```
   DATABASE_URL=postgres://user:password@localhost:5432/tinylink
   ```

4. Start the server:
   ```sh
   npm start
   ```
5. Open:
   ```
   http://localhost:3000
   ```

---

## 🌐 Deployment (Render)

- Deploy Node service on Render
- Add environment variable:

  ```
  DATABASE_URL = <Render internal PostgreSQL URL>
  ```

- Do **NOT** add PORT (Render provides it automatically)
- Use **external** DB URL only for connecting from your laptop
- Create the `links` table once in Render DB using psql

---

## 👤 Author

**Yogesh Kumar**

- GitHub: https://github.com/yogeshkr2002
- LinkedIn: https://www.linkedin.com/in/yogesh-kumar-2659a0285/

---
