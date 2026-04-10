const path = require('path');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function getApiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY is not set');
  return key;
}

exports.getStockPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'views', 'stocks.html'));
};

exports.getQuote = async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'symbol query parameter is required' });
  }

  try {
    const token = getApiKey();
    const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${token}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Finnhub API error: ${response.statusText}` });
    }

    const data = await response.json();

    // Finnhub returns all zeros when symbol is invalid
    if (data.c === 0 && data.h === 0 && data.l === 0) {
      return res.status(404).json({ error: `No data found for symbol "${symbol.toUpperCase()}"` });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch quote' });
  }
};

exports.getCandles = async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'symbol query parameter is required' });
  }

  try {
    const token = getApiKey();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    const url =
      `${FINNHUB_BASE}/stock/candle` +
      `?symbol=${encodeURIComponent(symbol.toUpperCase())}` +
      `&resolution=D` +
      `&from=${thirtyDaysAgo}` +
      `&to=${now}` +
      `&token=${token}`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Finnhub API error: ${response.statusText}` });
    }

    const data = await response.json();

    if (data.s === 'no_data') {
      return res.status(404).json({ error: `No candle data found for symbol "${symbol.toUpperCase()}"` });
    }

    // Transform parallel arrays into an array of candle objects
    const candles = data.t.map((timestamp, i) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));

    res.json({ symbol: symbol.toUpperCase(), candles });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch candles' });
  }
};
