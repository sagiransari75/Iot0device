// ─── Auth Routes (IotSimX Backend) ──────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const prisma  = require('../prisma'); // Make sure this points to your prisma client instance

// Password Hashing Utility
function hashPassword(password) {
  const salt = 'iotsimx-static-salt';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Simple Token Generator
function generateToken(id) {
  return crypto.randomBytes(32).toString('hex') + '.' + Buffer.from(String(id)).toString('base64');
}

// In-memory session store
const activeTokens = new Map();

// ── Seed Demo User (Optional) ──────────────────────────────────────────────────
(async function seedDemoUser() {
  try {
    const demoEmail = 'demo@iotsimx.dev';
    try {
      // Try to find existing demo user
      const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
      if (existing) return; // Already seeded
    } catch (findErr) {
      // Database might be empty or have issues, try to create anyway
      if (findErr.message.includes('converting field')) {
        console.warn('⚠️  Database schema mismatch - skipping seed check');
        return;
      }
    }
    
    // Create demo user
    try {
      await prisma.user.create({
        data: {
          email: demoEmail,
          name: 'Demo User',
          passwordHash: hashPassword('demo1234'),
          role: 'admin',
        }
      });
      console.log('✅ Seeded demo user: demo@iotsimx.dev / demo1234');
    } catch (createErr) {
      if (!createErr.message.includes('Unique constraint failed')) {
        console.log('ℹ️  Demo user already exists or seed skipped');
      }
    }
  } catch (err) {
    console.warn('⚠️  Seed initialization skipped (database may need setup)');
  }
})();

// ── Middleware: Verify Token ──────────────────────────────────────────────────
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

  // 1. Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ error: 'Invalid email address format.' });
  }
  if (password.length < 6) {
    return res.status(422).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // 2. Check if user exists
    const existing = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 3. Create User in DB
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
      }
    });

    // 4. Generate Token
    const token = generateToken(user.id);
    activeTokens.set(token, user.id);

    console.log(`✨ New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatar: user.name[0].toUpperCase() 
      },
    });

  } catch (err) {
    console.error("❌ SIGNUP_DB_ERROR:", err);
    res.status(500).json({ error: 'Database error. Make sure your DB is connected.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify Password Hash
    const hash = hashPassword(password);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);
    activeTokens.set(token, user.id);

    console.log(`🔑 User logged in: ${user.email}`);

    res.json({
      success: true,
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatar: user.name[0].toUpperCase() 
      },
    });

  } catch (err) {
    console.error("❌ LOGIN_DB_ERROR:", err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    res.json({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.name[0].toUpperCase() 
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) activeTokens.delete(token);
  res.json({ success: true });
});

module.exports = { router, requireAuth };