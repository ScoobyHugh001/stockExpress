# ExpressStocks

Demo application for RTS Labs take home project. 

## Architecture

```
express-app/
├── src/
│   ├── app.js                   # Express entry point & middleware stack
│   ├── config/config.js         # PORT, NODE_ENV from environment
│   ├── controllers/
│   │   ├── authController.js    # Signup, login, current-user handlers
│   │   ├── stockController.js   # Finnhub proxy (quote + candles)
│   │   ├── homeController.js    # Home & about pages
│   │   └── apiController.js     # Health-check & sample data
│   ├── middleware/
│   │   ├── requireAuth.js       # Global auth gate (JWT from header or cookie)
│   │   ├── auth.js              # Per-route Bearer-token middleware
│   │   └── errorHandler.js      # Centralised error handler
│   └── routes/
│       ├── auth.js              # /login, /signup, /api/auth/*
│       ├── stocks.js            # /stocks, /api/stocks/*
│       ├── index.js             # /, /about
│       └── api.js               # /api/status, /api/data
├── views/                       # Server-rendered HTML pages
│   ├── index.html
│   ├── about.html
│   ├── login.html
│   ├── signup.html
│   ├── stocks.html
│   └── partials/
├── public/                      # Static assets (CSS, JS, images)
│   ├── css/styles.css
│   ├── js/
│   │   ├── auth.js              # Client-side auth (forms, token cookie, nav toggle)
│   │   ├── stocks.js            # Client-side stock lookup & rendering
│   │   └── main.js              # API status widget
│   └── images/logo.jpg
├── tests/
│   ├── auth.test.js             # 18 tests — signup, login, route protection
│   └── stocks.test.js           # 8 tests — quote, candles, validation
├── Dockerfile
├── docker-compose.yml
└── .env                         # Environment variables (not committed)
```


### Authentication

- **JWT tokens** (1-hour expiry) issued on signup and login.
- Tokens are stored client-side in both `localStorage` (for API fetch calls) and a `token` cookie (for server-side page-navigation checks).
- A global `requireAuth` middleware runs before every route. It whitelists `/login`, `/signup`, and their API endpoints; everything else requires a valid JWT.
  - **Page requests** without a token are redirected to `/login`.
  - **API requests** without a token receive a `401 JSON` response.
- Passwords are hashed with **bcryptjs** (10 salt rounds).
- Users are stored in an in-memory array (swap for a database in production).

### Stock Data (Finnhub)

- The Express server acts as a **proxy** to the Finnhub REST API so the API key never reaches the browser.
- Two endpoints are exposed:
  - `GET /api/stocks/quote?symbol=AAPL` — current price, change, day range, previous close.
  - `GET /api/stocks/candles?symbol=AAPL` — 30-day daily OHLCV data, transformed from Finnhub's parallel-array format into an array of objects.
- The client fetches both in parallel and renders a quote card and a history table.

### Theming

- CSS custom properties define a **green and grey** palette extracted from the RTS Labs logo:
  - Green accent: `#8cc63f` (buttons, focus rings, hover states, positive values)
  - Dark grey: `#4a4a4a` (nav, footer, headings, table headers)
  - Light grey background: `#f4f4f4`
- The RTS Labs logo image is used in the navbar across all pages.

### Middleware Stack (order matters)

1. `express.json()` / `express.urlencoded()` — body parsing
2. `express.static()` — serve CSS, JS, and images
3. `requireAuth` — auth gate (after static so assets load on the login page)
4. Route handlers — auth, stocks, home, API
5. `errorHandler` — catch-all error middleware

## Prerequisites

- **Node.js** 18+ (uses built-in `fetch`)
- A free **Finnhub API key** from [finnhub.io](https://finnhub.io/)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root (or edit the existing one):

```env
PORT=3000
NODE_ENV=development
FINNHUB_API_KEY=your_finnhub_api_key_here
```

Optionally set a custom JWT secret (defaults to a dev-only value):

```env
JWT_SECRET=your-secret-here
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**. Nodemon will restart on file changes.

### 4. Start the production server

```bash
npm start
```

## Running with Docker

```bash
# Build and start
docker compose up --build

# Or build the image directly
docker build -t express-stocks .
docker run -p 3000:3000 \
  -e FINNHUB_API_KEY=your_key \
  -e JWT_SECRET=your_secret \
  express-stocks
```

The container runs as a non-root user with a health check on `/api/status`.

## Running Tests

```bash
npm test
```

Runs **26 tests** across two suites:

| Suite | Tests | Coverage |
|---|---|---|
| `auth.test.js` | 18 | Signup, login, `/api/auth/me`, page routes, full auth flow, route protection (redirects + 401), cookie and Bearer token auth |
| `stocks.test.js` | 8 | Quote formatting, symbol normalisation, Finnhub URL construction, candle transformation, missing-symbol validation |

Stock tests mock `global.fetch` so no Finnhub API key is needed to run them.

## Routes Reference

### Public (no auth required)

| Method | Path | Description |
|---|---|---|
| GET | `/login` | Login page |
| GET | `/signup` | Sign-up page |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| POST | `/api/auth/signup` | Create account and receive JWT |

### Protected (auth required)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Home page |
| GET | `/about` | About page |
| GET | `/stocks` | Stock lookup page |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/stocks/quote?symbol=X` | Current price for ticker X |
| GET | `/api/stocks/candles?symbol=X` | 30-day daily OHLCV for ticker X |
| GET | `/api/status` | Health check (`{ status, uptime }`) |
| GET | `/api/data` | Sample data endpoint |

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4.18 |
| Auth | JWT + bcryptjs |
| Market Data | Finnhub REST API |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Testing | Jest + Supertest |
| Container | Docker (Alpine, multi-stage) |
