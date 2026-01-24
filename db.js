const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'expenses.db');
const db = new sqlite3.Database(DB_PATH);

// Initialize database schema
function initDatabase() {
  db.serialize(() => {
    // Trips table
    db.run(`
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_settled BOOLEAN DEFAULT 0
      )
    `);

    // Members table
    db.run(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        upi_id TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(id),
        UNIQUE(trip_id, name)
      )
    `);

    // Expenses table
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        payer_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id),
        FOREIGN KEY (payer_id) REFERENCES members(id)
      )
    `);

    // Expense participants (who shares this expense)
    db.run(`
      CREATE TABLE IF NOT EXISTS expense_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        FOREIGN KEY (expense_id) REFERENCES expenses(id),
        FOREIGN KEY (member_id) REFERENCES members(id),
        UNIQUE(expense_id, member_id)
      )
    `);

    // Migration: Add upi_id column if it doesn't exist (for existing databases)
    db.run(`
      ALTER TABLE members ADD COLUMN upi_id TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Migration error:', err);
      }
    });

    console.log('✓ Database initialized');
  });
}

// Helper to run queries with promises
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery
};
