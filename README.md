# 💰 Trip Expense Tracker

> A minimal, blazingly fast expense tracking and settlement system for group trips. Built with vanilla JavaScript, Express, and SQLite.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/trip-expense-tracker)

## 🚀 Features

- ⚡ **Lightning Fast** - No build steps, pure vanilla JS
- 🎯 **Smart Settlement** - Minimum transaction algorithm
- 📱 **Mobile First** - Responsive on all devices
- 🔒 **Trip Locking** - Finalize settlements permanently
- 📊 **Category Tracking** - Food, stay, transport, activities
- 💸 **Fair Splits** - Split expenses with selected members

---

## 📸 Screenshots

![Landing Page](https://via.placeholder.com/800x400?text=Add+Your+Screenshots+Here)

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (file-based, zero config)
- **Frontend:** HTML5 + CSS3 +  JavaScript
- **Deployment:** Vercel (serverless)

---

## 🏃‍♂️ Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/trip-expense-tracker.git
cd trip-expense-tracker

# Install dependencies
npm install

# Start the server
npm start

# Open browser
open http://localhost:3000
```

### Deploy to Vercel

1. Fork this repository
2. Create account on [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your forked repository
5. Click "Deploy"
6. Done! 🎉

Or click this button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/trip-expense-tracker)

---

## 📖 How It Works

### 1. Create Trip
- Add trip name and members (minimum 2)
- Each trip is isolated

### 2. Add Expenses
- Enter amount, description, category
- Select who paid
- Choose participants (subset or all)

### 3. Calculate Settlement
- View individual balances
- See who owes whom
- Minimum number of transactions

### 4. Lock Trip
- Finalize settlement
- Prevent new expenses
- Trip becomes read-only

---

## 🧮 Settlement Algorithm

Uses **greedy creditor-debtor matching** to minimize transactions:

```
1. Calculate net balance for each member
   (total paid - total owed)

2. Separate into creditors (+ve) and debtors (-ve)

3. Match largest debtor with largest creditor

4. Repeat until all settled
```

**Time Complexity:** O(n log n)  
**Guarantees:** Deterministic, audit-friendly, exact arithmetic

---

## 📂 Project Structure

```
trip-expense-tracker/
├── server.js           # Express API server
├── db.js               # SQLite database setup
├── settlement.js       # Settlement algorithm
├── package.json        # Dependencies
├── vercel.json         # Vercel config
├── .gitignore          # Git ignore rules
└── public/
    ├── index.html      # Landing page
    ├── trip.html       # Trip dashboard
    └── style.css       # Premium CSS
```

---

## 🔌 API Endpoints

### `POST /api/trips`
Create new trip
```json
{
  "name": "Goa Trip 2026",
  "members": ["Alice", "Bob", "Charlie"]
}
```

### `GET /api/trips/:id`
Get trip details

### `POST /api/expenses`
Add expense
```json
{
  "tripId": 1,
  "description": "Lunch",
  "amount": 500,
  "payerId": 1,
  "category": "food",
  "participantIds": [1, 2, 3]
}
```

### `GET /api/trips/:id/expenses`
Get all expenses

### `GET /api/trips/:id/calculate`
Calculate settlement (preview)

### `POST /api/trips/:id/settle`
Lock trip and finalize settlement

---

## 🎨 Design Features

- **Glassmorphism** - Frosted glass card effects
- **Gradient Animations** - Shimmer & pulse effects
- **Micro-interactions** - Smooth hover states
- **3D Depth** - Cards float on hover
- **Custom Scrollbar** - Styled gradient scrollbar
- **Responsive Grid** - Works on mobile, tablet, desktop

---

## 🚧 Roadmap

- [ ] Multi-currency support
- [ ] Receipt image upload
- [ ] Export to PDF
- [ ] Email notifications
- [ ] Group chat integration
- [ ] Split by percentage (not just equal)
- [ ] Recurring expenses

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🐛 Known Issues

- SQLite doesn't persist on Vercel (serverless limitation)
  - **Solution:** Migrate to PostgreSQL/MongoDB for production
- Trip data resets on each deployment
  - **Solution:** Use external database service

---

## 💡 Production Considerations

For production deployment, consider:

1. **Database:** Replace SQLite with PostgreSQL/MongoDB
2. **Authentication:** Add user accounts and login
3. **Authorization:** Trip ownership and access control
4. **Validation:** Server-side input sanitization
5. **Error Handling:** Better error messages
6. **Monitoring:** Add logging and analytics
7. **Rate Limiting:** Prevent API abuse
8. **Caching:** Redis for performance
9. **CDN:** Serve static assets via CDN
10. **Testing:** Unit and integration tests

---

## 📧 Contact

Created by [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

⭐ Star this repo if you found it helpful!

---

## 🙏 Acknowledgments

- Design inspired by Stripe, Linear, and Vercel
- Settlement algorithm based on standard accounting principles
- Built during a weekend hackathon 🚀
