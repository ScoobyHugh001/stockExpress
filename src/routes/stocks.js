const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Page route
router.get('/stocks', stockController.getStockPage);

// API proxy routes
router.get('/api/stocks/quote', stockController.getQuote);
router.get('/api/stocks/candles', stockController.getCandles);

module.exports = router;
