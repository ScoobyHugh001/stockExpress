const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];

function requireAuth(req, res, next) {
  // Allow static assets through (served by express.static, but just in case)
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
    return next();
  }

  // Allow whitelisted paths
  if (PUBLIC_PATHS.includes(req.path)) {
    return next();
  }

  // Try to get token from Authorization header or cookie
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)token=([^\s;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) {
    // API routes get a JSON 401; page routes get redirected to login
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/login');
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.redirect('/login');
  }
}

module.exports = requireAuth;
