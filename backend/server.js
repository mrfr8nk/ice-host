// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize Express
const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Route Imports (must be after middleware but before error handling)
const authRouter = require('./routes/auth');
const deploymentsRouter = require('./routes/deployments');
const walletRouter = require('./routes/wallet');

// Route Middleware
app.use('/api/auth', authRouter);
app.use('/api/deployments', deploymentsRouter);
app.use('/api/wallet', walletRouter);

// Serve Frontend (must be after API routes)
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Error Handling (must be last middleware)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin access: ${process.env.ADMIN_USERNAME}`);
});
