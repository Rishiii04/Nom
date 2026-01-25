const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// SQLite DB
const db = new sqlite3.Database(path.join(__dirname, "expenses.db"));

// Init table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId TEXT,
      payerId INTEGER,
      payer_name TEXT,
      amount REAL,
      description TEXT,
      category TEXT
    )
  `);
});

// ---------------- HEALTH ----------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------------- TRIPS (MISSING BEFORE) ----------------

// Load trip
app.get("/api/trips/:tripId", (req, res) => {
  res.json({
    trip: {
      id: req.params.tripId,
      name: "Demo Trip",
      is_settled: 0
    },
    members: [
      { id: 1, name: "You", upiId: "you@upi" },
      { id: 2, name: "Friend", upiId: "friend@upi" }
    ]
  });
});

// Trip expenses
app.get("/api/trips/:tripId/expenses", (req, res) => {
  db.all(
    `SELECT * FROM expenses WHERE tripId = ?`,
    [req.params.tripId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const formatted = rows.map(r => ({
        ...r,
        participants: [{ id: 1, name: "You" }, { id: 2, name: "Friend" }]
      }));

      res.json(formatted);
    }
  );
});

// Calculate settlement
app.get("/api/trips/:tripId/calculate", (req, res) => {
  res.json({
    memberStats: [],
    settlements: []
  });
});

// Settle trip
app.post("/api/trips/:tripId/settle", (req, res) => {
  res.json({ success: true });
});

// ---------------- EXPENSES ----------------

// Create expense
app.post("/api/expenses", (req, res) => {
  const { tripId, description, amount, payerId, category } = req.body;

  db.run(
    `INSERT INTO expenses (tripId, payerId, payer_name, amount, description, category)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [tripId, payerId, "You", amount, description, category],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Update expense
app.put("/api/expenses/:id", (req, res) => {
  const { description, amount, category } = req.body;

  db.run(
    `UPDATE expenses SET description=?, amount=?, category=? WHERE id=?`,
    [description, amount, category, req.params.id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Delete expense
app.delete("/api/expenses/:id", (req, res) => {
  db.run(
    `DELETE FROM expenses WHERE id=?`,
    [req.params.id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// -------------------------------------------------------

// Vercel export
module.exports = app;
