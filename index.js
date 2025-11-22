const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());

// ✅ Serve Tailwind Dashboard UI
app.use(express.static(path.join(__dirname, "public")));

let pool;
const useDb = !!process.env.DATABASE_URL;
if (useDb) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  pool = null;
  console.warn(
    "DATABASE_URL not provided — using in-memory store (not persistent)."
  );
}

// In-memory fallback
const mem = {
  links: {},
};

const CODE_RE = /^[A-Za-z0-9]{6,8}$/;

// -------------------- Helper functions --------------------------
async function getLink(code) {
  if (pool) {
    const r = await pool.query("SELECT * FROM links WHERE code=$1 LIMIT 1", [
      code,
    ]);
    return r.rows[0] || null;
  } else {
    return mem.links[code] || null;
  }
}

async function createLink(link) {
  if (pool) {
    const q = `INSERT INTO links(code, url, title, clicks, created_at, last_clicked_at, deleted)
               VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const values = [
      link.code,
      link.url,
      link.title || "",
      link.clicks || 0,
      link.created_at,
      link.last_clicked_at || null,
      link.deleted || false,
    ];
    const r = await pool.query(q, values);
    return r.rows[0];
  } else {
    mem.links[link.code] = link;
    return link;
  }
}

async function incrementClick(code) {
  if (pool) {
    const q = `UPDATE links SET clicks = clicks + 1, last_clicked_at = NOW() WHERE code=$1 RETURNING *`;
    const r = await pool.query(q, [code]);
    return r.rows[0] || null;
  } else {
    const l = mem.links[code];
    if (!l) return null;
    l.clicks = (l.clicks || 0) + 1;
    l.last_clicked_at = new Date().toISOString();
    return l;
  }
}

async function softDelete(code) {
  if (pool) {
    const q = `UPDATE links SET deleted = true WHERE code=$1 RETURNING *`;
    const r = await pool.query(q, [code]);
    return r.rows[0] || null;
  } else {
    const l = mem.links[code];
    if (!l) return null;
    l.deleted = true;
    return l;
  }
}

// -------------------- Routes --------------------------

app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// Create link
app.post("/api/links", async (req, res) => {
  try {
    let { code, url, title } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "invalid url" });
    }

    if (!code) {
      code = Math.random()
        .toString(36)
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 6);
    }

    if (!CODE_RE.test(code)) {
      return res
        .status(400)
        .json({ error: "code must match /^[A-Za-z0-9]{6,8}$/" });
    }

    const existing = await getLink(code);

    if (existing) {
      return res.status(409).json({ error: "code already exists" });
    }

    const now = new Date();
    const link = {
      code,
      url,
      title: title || "",
      clicks: 0,
      created_at: now.toISOString(),
      last_clicked_at: null,
      deleted: false,
    };

    const created = await createLink(link);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// List links
app.get("/api/links", async (req, res) => {
  try {
    if (pool) {
      const r = await pool.query(
        "SELECT * FROM links ORDER BY created_at DESC LIMIT 100"
      );
      res.json(r.rows);
    } else {
      const arr = Object.values(mem.links).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      res.json(arr);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// Get single
app.get("/api/links/:code", async (req, res) => {
  try {
    const l = await getLink(req.params.code);
    if (!l) return res.status(404).json({ error: "not found" });
    res.json(l);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// Delete
app.delete("/api/links/:code", async (req, res) => {
  try {
    const l = await getLink(req.params.code);
    if (!l) return res.status(404).json({ error: "not found" });
    const deleted = await softDelete(req.params.code);
    res.json({ ok: true, deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// Stats page
app.get("/code/:code", async (req, res) => {
  try {
    const l = await getLink(req.params.code);
    if (!l) return res.status(404).send("Not found");

    res.send(`<h1>Stats for ${req.params.code}</h1>
      <p>URL: <a href="${l.url}">${l.url}</a></p>
      <p>Clicks: ${l.clicks || 0}</p>
      <p>Created: ${l.created_at}</p>
      <p>Last clicked: ${l.last_clicked_at || "never"}</p>
      <p>Deleted: ${l.deleted ? "yes" : "no"}</p>
      <p><a href="/">Back</a></p>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
});

// Redirect
app.get("/:code", async (req, res) => {
  const code = req.params.code;

  if (code === "healthz" || code === "api" || code === "code")
    return res.status(404).send("Not found");

  const l = await getLink(code);
  if (!l || l.deleted) return res.status(404).send("Not found");

  await incrementClick(code);
  res.redirect(302, l.url);
});

// ----------- NEW: Serve Tailwind Dashboard Homepage ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Listening on", port);
});
