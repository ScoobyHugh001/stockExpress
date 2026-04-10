const request = require('supertest');
const app = require('../src/app');
const { _users: users } = require('../src/controllers/authController');

// Mock the global fetch used by stockController
const originalFetch = global.fetch;

let authToken;

beforeAll(async () => {
  process.env.FINNHUB_API_KEY = 'test-api-key';

  // Create a user and get a token for authenticated requests
  users.length = 0;
  const res = await request(app).post('/api/auth/signup').send({
    name: 'StockTestUser',
    email: 'stocktest@example.com',
    password: 'password123',
  });
  authToken = res.body.token;
});

afterAll(() => {
  global.fetch = originalFetch;
  users.length = 0;
});

function mockFetch(urlHandler) {
  global.fetch = jest.fn((url) => {
    const result = urlHandler(url);
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(result),
    });
  });
}

function authGet(path) {
  return request(app).get(path).set('Cookie', `token=${authToken}`);
}

describe('Stocks — Happy Path', () => {
  describe('GET /stocks', () => {
    it('serves the stock lookup page when authenticated', async () => {
      const res = await authGet('/stocks');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });
  });

  describe('GET /api/stocks/quote', () => {
    it('returns formatted quote data for a valid symbol', async () => {
      mockFetch(() => ({
        c: 189.84,
        d: 2.44,
        dp: 1.3,
        h: 190.65,
        l: 187.11,
        o: 187.51,
        pc: 187.4,
      }));

      const res = await request(app)
        .get('/api/stocks/quote?symbol=AAPL')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        symbol: 'AAPL',
        currentPrice: 189.84,
        change: 2.44,
        percentChange: 1.3,
        high: 190.65,
        low: 187.11,
        open: 187.51,
        previousClose: 187.4,
      });
    });

    it('uppercases the symbol in the response', async () => {
      mockFetch(() => ({
        c: 150.0,
        d: 1.0,
        dp: 0.67,
        h: 151.0,
        l: 149.0,
        o: 149.5,
        pc: 149.0,
      }));

      const res = await request(app)
        .get('/api/stocks/quote?symbol=aapl')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('AAPL');
    });

    it('passes the symbol and API key to Finnhub', async () => {
      mockFetch(() => ({
        c: 100,
        d: 1,
        dp: 1,
        h: 101,
        l: 99,
        o: 99.5,
        pc: 99,
      }));

      await request(app)
        .get('/api/stocks/quote?symbol=MSFT')
        .set('Authorization', `Bearer ${authToken}`);

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('symbol=MSFT');
      expect(calledUrl).toContain('token=test-api-key');
      expect(calledUrl).toContain('/quote');
    });
  });

  describe('GET /api/stocks/candles', () => {
    it('returns transformed candle data for a valid symbol', async () => {
      const timestamp1 = Math.floor(new Date('2026-03-10').getTime() / 1000);
      const timestamp2 = Math.floor(new Date('2026-03-11').getTime() / 1000);

      mockFetch(() => ({
        s: 'ok',
        t: [timestamp1, timestamp2],
        o: [185.0, 187.0],
        h: [188.0, 190.0],
        l: [184.0, 186.0],
        c: [187.5, 189.0],
        v: [50000000, 48000000],
      }));

      const res = await request(app)
        .get('/api/stocks/candles?symbol=AAPL')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('AAPL');
      expect(res.body.candles).toHaveLength(2);
      expect(res.body.candles[0]).toEqual({
        date: '2026-03-10',
        open: 185.0,
        high: 188.0,
        low: 184.0,
        close: 187.5,
        volume: 50000000,
      });
    });

    it('passes resolution=D and date range to Finnhub', async () => {
      mockFetch(() => ({
        s: 'ok',
        t: [1000000],
        o: [100],
        h: [101],
        l: [99],
        c: [100.5],
        v: [10000],
      }));

      await request(app)
        .get('/api/stocks/candles?symbol=TSLA')
        .set('Authorization', `Bearer ${authToken}`);

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('symbol=TSLA');
      expect(calledUrl).toContain('resolution=D');
      expect(calledUrl).toContain('from=');
      expect(calledUrl).toContain('to=');
      expect(calledUrl).toContain('token=test-api-key');
      expect(calledUrl).toContain('/stock/candle');
    });
  });

  describe('Validation', () => {
    it('returns 400 when symbol is missing for quote', async () => {
      const res = await request(app)
        .get('/api/stocks/quote')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/symbol/i);
    });

    it('returns 400 when symbol is missing for candles', async () => {
      const res = await request(app)
        .get('/api/stocks/candles')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/symbol/i);
    });
  });
});
