const express = require('express');
const path = require('path');
const { initDatabase, runQuery, getQuery, allQuery } = require('./db');
const { calculateSettlement, formatSettlement } = require('./settlement');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize database
initDatabase();

// ============ API ROUTES ============

// Create a new trip
app.post('/api/trips', async (req, res) => {
  try {
    const { name, members } = req.body;
    
    if (!name || !members || members.length < 2) {
      return res.status(400).json({ error: 'Trip name and at least 2 members required' });
    }

    // Create trip
    const trip = await runQuery('INSERT INTO trips (name) VALUES (?)', [name]);
    const tripId = trip.id;

    // Add members (support both string names and objects with {name, upiId})
    for (const member of members) {
      const memberName = typeof member === 'string' ? member : member.name;
      const upiId = typeof member === 'object' ? member.upiId : null;
      
      await runQuery(
        'INSERT INTO members (trip_id, name, upi_id) VALUES (?, ?, ?)', 
        [tripId, memberName, upiId]
      );
    }

    res.json({ tripId, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Get trip details
app.get('/api/trips/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    
    const trip = await getQuery('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const members = await allQuery('SELECT * FROM members WHERE trip_id = ?', [tripId]);
    
    res.json({ trip, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { tripId, description, amount, payerId, category, participantIds } = req.body;

    // Validate
    if (!tripId || !description || !amount || !payerId || !category || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if trip is settled
    const trip = await getQuery('SELECT is_settled FROM trips WHERE id = ?', [tripId]);
    if (trip.is_settled) {
      return res.status(400).json({ error: 'Cannot add expenses to a settled trip' });
    }

    // Insert expense
    const expense = await runQuery(
      'INSERT INTO expenses (trip_id, description, amount, payer_id, category) VALUES (?, ?, ?, ?, ?)',
      [tripId, description, amount, payerId, category]
    );

    // Add participants
    for (const participantId of participantIds) {
      await runQuery(
        'INSERT INTO expense_participants (expense_id, member_id) VALUES (?, ?)',
        [expense.id, participantId]
      );
    }

    res.json({ expenseId: expense.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Get all expenses for a trip
app.get('/api/trips/:id/expenses', async (req, res) => {
  try {
    const tripId = req.params.id;

    const expenses = await allQuery(
      `SELECT e.*, m.name as payer_name 
       FROM expenses e 
       JOIN members m ON e.payer_id = m.id 
       WHERE e.trip_id = ? 
       ORDER BY e.created_at ASC`,
      [tripId]
    );

    // Get participants for each expense
    for (const expense of expenses) {
      const participants = await allQuery(
        `SELECT m.id, m.name 
         FROM expense_participants ep 
         JOIN members m ON ep.member_id = m.id 
         WHERE ep.expense_id = ?`,
        [expense.id]
      );
      expense.participants = participants;
    }

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Calculate balances and settlement (preview mode)
app.get('/api/trips/:id/calculate', async (req, res) => {
  try {
    const tripId = req.params.id;

    const members = await allQuery('SELECT * FROM members WHERE trip_id = ?', [tripId]);
    
    const expenses = await allQuery(
      'SELECT * FROM expenses WHERE trip_id = ?',
      [tripId]
    );

    // Get participants for each expense
    for (const expense of expenses) {
      const participants = await allQuery(
        'SELECT member_id FROM expense_participants WHERE expense_id = ?',
        [expense.id]
      );
      expense.participants = participants.map(p => p.member_id);
    }

    // Calculate settlement
    const result = calculateSettlement(expenses, members);
    const formattedSettlements = formatSettlement(result.settlements, members);

    // Calculate totals for each member
    const memberStats = members.map(member => {
      const paid = expenses
        .filter(e => e.payer_id === member.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const owed = expenses
        .filter(e => e.participants.includes(member.id))
        .reduce((sum, e) => sum + (e.amount / e.participants.length), 0);

      return {
        id: member.id,
        name: member.name,
        upi_id: member.upi_id,
        paid: Math.round(paid * 100) / 100,
        owed: Math.round(owed * 100) / 100,
        balance: result.balances[member.id] || 0
      };
    });

    res.json({
      memberStats,
      settlements: formattedSettlements
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate settlement' });
  }
});


// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expenseId = req.params.id;
    
    // Get trip_id to check if settled
    const expense = await getQuery('SELECT trip_id FROM expenses WHERE id = ?', [expenseId]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const trip = await getQuery('SELECT is_settled FROM trips WHERE id = ?', [expense.trip_id]);
    if (trip.is_settled) {
      return res.status(400).json({ error: 'Cannot delete expenses from a settled trip' });
    }

    // Delete expense participants first (foreign key constraint)
    await runQuery('DELETE FROM expense_participants WHERE expense_id = ?', [expenseId]);
    
    // Delete expense
    await runQuery('DELETE FROM expenses WHERE id = ?', [expenseId]);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { description, amount, payerId, category, participantIds } = req.body;

    // Validate
    if (!description || !amount || !payerId || !category || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get trip_id to check if settled
    const expense = await getQuery('SELECT trip_id FROM expenses WHERE id = ?', [expenseId]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const trip = await getQuery('SELECT is_settled FROM trips WHERE id = ?', [expense.trip_id]);
    if (trip.is_settled) {
      return res.status(400).json({ error: 'Cannot edit expenses in a settled trip' });
    }

    // Update expense
    await runQuery(
      'UPDATE expenses SET description = ?, amount = ?, payer_id = ?, category = ? WHERE id = ?',
      [description, amount, payerId, category, expenseId]
    );

    // Delete old participants
    await runQuery('DELETE FROM expense_participants WHERE expense_id = ?', [expenseId]);

    // Add new participants
    for (const participantId of participantIds) {
      await runQuery(
        'INSERT INTO expense_participants (expense_id, member_id) VALUES (?, ?)',
        [expenseId, participantId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});
// Get all trips (for trips page)
app.get('/api/trips/all', async (req, res) => {
  try {
    const trips = await allQuery(`
      SELECT 
        t.id,
        t.name,
        t.created_at,
        t.is_settled,
        COUNT(DISTINCT m.id) as member_count,
        COUNT(DISTINCT e.id) as expense_count,
        COALESCE(SUM(e.amount), 0) as total_expenses
      FROM trips t
      LEFT JOIN members m ON t.id = m.trip_id
      LEFT JOIN expenses e ON t.id = e.trip_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});


// Settle trip (mark as finalized)
app.post('/api/trips/:id/settle', async (req, res) => {
  try {
    const tripId = req.params.id;
    
    await runQuery('UPDATE trips SET is_settled = 1 WHERE id = ?', [tripId]);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to settle trip' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Server running at http://localhost:${PORT}`);
  console.log(`✓ Database ready`);
  console.log(`\n→ Open http://localhost:${PORT} to start\n`);
});
