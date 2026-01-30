require("dotenv").config({ path: "./.env" });
console.log("ENV CHECK:", {
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
});

console.log("server.js started");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const auth = require("./middleware/auth");

console.log("auth type:", typeof auth); // ✅ now it works

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}
function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// ---------- AUTH ----------
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const password_hash = await bcrypt.hash(password, 10);
  try {
    const result = await run(
      db,
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email.toLowerCase().trim(), password_hash]
    );
    res.status(201).json({ id: result.lastID, email: email.toLowerCase().trim() });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const user = await get(db, "SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// ---------- CONTACTS (user-scoped) ----------
app.get("/contacts", auth, async (req, res) => {
  const contacts = await all(
    db,
    "SELECT id, name, email, phone, created_at, updated_at FROM contacts WHERE user_id = ? ORDER BY id DESC",
    [req.user.id]
  );
  res.json({ data: contacts });
});

app.post("/contacts", auth, async (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });

  const result = await run(
    db,
    "INSERT INTO contacts (user_id, name, email, phone) VALUES (?, ?, ?, ?)",
    [req.user.id, name.trim(), email?.trim() || null, phone?.trim() || null]
  );

  const created = await get(
    db,
    "SELECT id, name, email, phone, created_at, updated_at FROM contacts WHERE id = ? AND user_id = ?",
    [result.lastID, req.user.id]
  );

  res.status(201).json({ data: created });
});

// Get a single contact by id (user-scoped)
app.get("/contacts/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const contact = await get(
    db,
    "SELECT id, name, email, phone, created_at, updated_at FROM contacts WHERE id = ? AND user_id = ?",
    [id, req.user.id]
  );

  if (!contact) return res.status(404).json({ error: "Contact not found" });

  res.json({ data: contact });
});

// Delete a contact by id (user-scoped)
app.delete("/contacts/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "invalid id" });
  }

  const result = await run(
    db,
    "DELETE FROM contacts WHERE id = ? AND user_id = ?",
    [id, req.user.id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: "Contact not found" });
  }

  return res.json({ message: "Contact deleted" });
});

app.put("/contacts/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const { name, email, phone } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });

  const existing = await get(db, "SELECT id FROM contacts WHERE id = ? AND user_id = ?", [id, req.user.id]);
  if (!existing) return res.status(404).json({ error: "Contact not found" });

  await run(
    db,
    `UPDATE contacts
     SET name = ?, email = ?, phone = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`,
    [name.trim(), email?.trim() || null, phone?.trim() || null, id, req.user.id]
  );

  const updated = await get(
    db,
    "SELECT id, name, email, phone, created_at, updated_at FROM contacts WHERE id = ? AND user_id = ?",
    [id, req.user.id]
  );

  res.json({ data: updated });
});

app.get("/", (req, res) => res.send("Contacts API running ✅"));

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
