// Deterministic settlement algorithm using creditor-debtor matching
// Goal: Minimize number of transactions

/**
 * Calculate settlement for a trip
 * @param {Array} expenses - List of expense objects with payer, amount, participants
 * @param {Array} members - List of all trip members
 * @returns {Object} - { balances: {}, settlements: [] }
 */
function calculateSettlement(expenses, members) {
  // Step 1: Initialize balances (positive = will receive, negative = owes)
  const balances = {};
  members.forEach(member => {
    balances[member.id] = 0;
  });

  // Step 2: Calculate net balance for each member
  expenses.forEach(expense => {
    const participantCount = expense.participants.length;
    const sharePerPerson = expense.amount / participantCount;

    // Payer gets credited
    balances[expense.payer_id] += expense.amount;

    // Each participant gets debited their share
    expense.participants.forEach(participantId => {
      balances[participantId] -= sharePerPerson;
    });
  });

  // Step 3: Round to 2 decimal places to avoid floating point issues
  Object.keys(balances).forEach(id => {
    balances[id] = Math.round(balances[id] * 100) / 100;
  });

  // Step 4: Separate creditors and debtors
  const creditors = []; // People who will receive money
  const debtors = [];   // People who owe money

  Object.entries(balances).forEach(([memberId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ id: parseInt(memberId), amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: parseInt(memberId), amount: Math.abs(balance) });
    }
  });

  // Step 5: Match debtors to creditors (greedy algorithm)
  const settlements = [];
  let creditorIdx = 0;
  let debtorIdx = 0;

  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];

    // Amount to settle is minimum of what creditor needs and debtor owes
    const settleAmount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(settleAmount * 100) / 100
    });

    // Update remaining amounts
    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    // Move to next creditor/debtor if current one is settled
    if (creditor.amount < 0.01) creditorIdx++;
    if (debtor.amount < 0.01) debtorIdx++;
  }

  return {
    balances,
    settlements
  };
}

/**
 * Get member by ID
 */
function getMember(members, memberId) {
  return members.find(m => m.id === memberId);
}

/**
 * Get member name by ID
 */
function getMemberName(members, memberId) {
  const member = getMember(members, memberId);
  return member ? member.name : `User ${memberId}`;
}

/**
 * Format settlement for display with UPI support
 */
function formatSettlement(settlements, members) {
  return settlements.map(s => {
    const fromMember = getMember(members, s.from);
    const toMember = getMember(members, s.to);
    
    return {
      from: fromMember ? fromMember.name : `User ${s.from}`,
      to: toMember ? toMember.name : `User ${s.to}`,
      amount: s.amount,
      fromId: s.from,
      toId: s.to,
      // UPI data for receiver
      toUpiId: toMember ? toMember.upi_id : null,
      fromUpiId: fromMember ? fromMember.upi_id : null
    };
  });
}

module.exports = {
  calculateSettlement,
  getMemberName,
  getMember,
  formatSettlement
};
