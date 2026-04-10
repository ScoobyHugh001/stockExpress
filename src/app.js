const express = require('express');
const path = require('path');
require('dotenv').config();

const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const requireAuth = require('./middleware/requireAuth');
const errorHandler = require('./middleware/errorHandler');
const { PORT } = require('./config/config');

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Auth gate (must come after static files, before routes) ---
app.use(requireAuth);

// --- Routes ---
app.use('/', authRoutes);
app.use('/', stockRoutes);
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

// --- Error handling ---
app.use(errorHandler);

// --- Start server (skip when imported for testing) ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
