// ─── Auth Routes (IotSimX — Native MongoDB) ────────────────────────────────────
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { connect, toObjectId } = require('../db');

// ── Helpers ───────────────────────────────────────────────────────────────────
function hashPassword(password) {
  const salt = 'iotsimx-static-salt';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateToken(id) {
  return crypto.randomBytes(32).toString('hex') + '.' + Buffer.from(String(id)).toString('base64');
}

// In-memory session store (token → userId string)
const activeTokens = new Map();

// ── Seed Demo User ─────────────────────────────────────────────────────────────
(async function seedDemoUser() {
  try {
    const db    = await connect();
    const users = db.collection('users');
    const demo  = await users.findOne({ email: 'demo@iotsimx.dev' });
    if (demo) return;
    await users.insertOne({
      email:        'demo@iotsimx.dev',
      name:         'Demo User',
      passwordHash: hashPassword('demo1234'),
      role:         'admin',
      createdAt:    new Date(),
    });
    console.log('✅ Seeded demo user: demo@iotsimx.dev / demo1234');
  } catch (err) {
    console.warn('⚠️  Seed skipped:', err.message);
  }
})();

// ── Middleware: Verify Token ───────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized — please log in' });
  }
  req.userId = activeTokens.get(token);
  next();
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(422).json({ error: 'Invalid email address format.' });
  if (password.length < 6)
    return res.status(422).json({ error: 'Password must be at least 6 characters.' });

  try {
    const db    = await connect();
    const users = db.collection('users');

    const existing = await users.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const result = await users.insertOne({
      name:         name.trim(),
      email:        email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      role:         'user',
      createdAt:    new Date(),
    });

    const userId = result.insertedId.toString();
    const token  = generateToken(userId);
    activeTokens.set(token, userId);

    console.log(`✨ New user registered: ${email}`);
    res.status(201).json({
      success: true,
      token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: 'user', avatar: name[0].toUpperCase() },
    });
  } catch (err) {
    console.error('❌ SIGNUP_DB_ERROR:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const db   = await connect();
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    if (hashPassword(password) !== user.passwordHash)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const userId = user._id.toString();
    const token  = generateToken(userId);
    activeTokens.set(token, userId);

    console.log(`🔑 User logged in: ${user.email}`);
    res.json({
      success: true,
      token,
      user: { id: userId, name: user.name, email: user.email, role: user.role, avatar: user.name[0].toUpperCase() },
    });
  } catch (err) {
    console.error('❌ LOGIN_DB_ERROR:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const db   = await connect();
    const oid  = toObjectId(req.userId);
    const user = await db.collection('users').findOne({ _id: oid });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, avatar: user.name[0].toUpperCase() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token) activeTokens.delete(token);
  res.json({ success: true });
});

module.exports = { router, requireAuth };