const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (keep this – does NOT affect UI)
app.use(express.static(path.join(__dirname, "public")));

// SQLite DB (unchanged)
const db = new sqlite3.Database(path.join(__dirname, "expenses.db"));

// Init table (unchanged)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tripId TEXT,
      payer TEXT,
      amount REAL,
      description TEXT
    )
  `);
});

// ---------------- API ROUTES (UNCHANGED STRUCTURE) ----------------

// Example health route (safe to keep)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Add expense
app.post("/api/expense", (req, res) => {
  const { tripId, payer, amount, description } = req.body;

  if (!tripId || !payer || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    `INSERT INTO expenses (tripId, payer, amount, description)
     VALUES (?, ?, ?, ?)`,
    [tripId, payer, amount, description || ""],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Fetch expenses
app.get("/api/expenses/:tripId", (req, res) => {
  const { tripId } = req.params;

  db.all(
    `SELECT * FROM expenses WHERE tripId = ?`,
    [tripId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ---------------------------------------------------------------

// ❌ DO NOT start server
// ❌ NO app.listen()
// ✅ EXPORT for Vercel
module.exports = app;
