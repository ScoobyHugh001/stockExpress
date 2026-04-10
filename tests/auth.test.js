const request = require('supertest');
const app = require('../src/app');
const { _users: users } = require('../src/controllers/authController');

beforeEach(() => {
  users.length = 0;
});

describe('Auth — Happy Path', () => {
  const testUser = {
    name: 'Alice',
    email: 'alice@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/signup', () => {
    it('creates a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/signup').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
      expect(res.body.user.password).toBeUndefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in an existing user and returns a token', async () => {
      await request(app).post('/api/auth/signup').send(testUser);

      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('alice@example.com');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user when authenticated', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const token = signupRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      });
    });
  });

  describe('Page routes', () => {
    it('GET /login serves the login page without auth', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('GET /signup serves the signup page without auth', async () => {
      const res = await request(app).get('/signup');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });
  });

  describe('Full signup → login → access flow', () => {
    it('signs up, logs in with same credentials, and accesses protected route', async () => {
      // 1. Sign up
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      expect(signupRes.status).toBe(201);

      // 2. Login with same credentials
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(loginRes.status).toBe(200);
      const token = loginRes.body.token;

      // 3. Access protected route
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.name).toBe('Alice');
    });
  });

  describe('Logout (client-side token removal)', () => {
    it('returns 401 when accessing protected route without token (simulates logout)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });
  });
});

describe('Route Protection', () => {
  const testUser = {
    name: 'Bob',
    email: 'bob@example.com',
    password: 'password123',
  };

  describe('Unauthenticated access', () => {
    it('redirects GET / to /login', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('redirects GET /stocks to /login', async () => {
      const res = await request(app).get('/stocks');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('redirects GET /about to /login', async () => {
      const res = await request(app).get('/about');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('returns 401 JSON for protected API routes', async () => {
      const res = await request(app).get('/api/stocks/quote?symbol=AAPL');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('allows GET /login without auth', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
    });

    it('allows GET /signup without auth', async () => {
      const res = await request(app).get('/signup');
      expect(res.status).toBe(200);
    });

    it('allows POST /api/auth/signup without auth', async () => {
      const res = await request(app).post('/api/auth/signup').send(testUser);
      expect(res.status).toBe(201);
    });

    it('allows POST /api/auth/login without auth', async () => {
      await request(app).post('/api/auth/signup').send(testUser);
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
    });
  });

  describe('Authenticated access', () => {
    it('allows access to / with a valid token cookie', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const token = signupRes.body.token;

      const res = await request(app)
        .get('/')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('allows access to /stocks with a valid token cookie', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const token = signupRes.body.token;

      const res = await request(app)
        .get('/stocks')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('allows access to protected API with Bearer token', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send(testUser);
      const token = signupRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
