// ─── IotSimX Backend — Main Entry ─────────────────────────────────────────────
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
require('dotenv').config();

// ── State & Engine ────────────────────────────────────────────────────────────
const state        = require('./state');
const { generateSensorData, startSimulation } = require('./simulation');

// ── Routes ────────────────────────────────────────────────────────────────────
const sensorRoutes       = require('./routes/sensorRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const { router: authRoutes } = require('./routes/authRoutes');
const circuitRoutes      = require('./routes/circuitRoutes');
const historyRoutes      = require('./routes/historyRoutes'); 

// ── App setup ─────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ 
  origin: true, // Debugging ke liye temporarily true kiya hai taaki CORS block na ho
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ── Mount Routes ──────────────────────────────────────────────────────────────
// Routes ko ek specific order mein rakha hai
app.use('/api/auth', authRoutes);
app.use('/api/circuits', circuitRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/history', historyRoutes); // <--- Ensure this is above Wildcard 404
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── GPIO & Logic ──────────────────────────────────────────────────────────────

app.get('/api/gpio', (req, res) => res.json(state.gpioState));
app.post('/api/gpio/:pin/connect', (req, res) => {
  const pin = req.params.pin;
  const { sensor } = req.body;
  if (!state.gpioState[pin]) return res.status(400).json({ error: `Invalid pin: ${pin}` });
  state.gpioState[pin].sensor = sensor || null;
  state.logEvent(`GPIO${pin} connected to ${sensor || 'nothing'}`);
  res.json({ success: true, pin: state.gpioState[pin] });
});

app.post('/api/simulate', (req, res) => {
  const data = generateSensorData();
  io.emit('sensorData', { data, gpio: state.gpioState, log: state.simulationLog.slice(0, 15) });
  res.json({ success: true, data });
});

app.get('/api/health', (req, res) => {
  res.json({
    status:   'ok',
    uptime:   state.getUptimeSeconds(),
    running:  state.simulationRunning,
    ts:       new Date().toISOString(),
  });
});

// ── Error Handling for 404 (Hamesha saare Routes ke niche rahega) ─────────────
app.use('/api/*', (req, res) => {
  console.log(`⚠️ 404 Attempted: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: `No endpoint: ${req.method} ${req.originalUrl}`,
    hint: "Check if the route is correctly defined in historyRoutes.js"
  });
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const id = socket.id.slice(0, 8);
  console.log(`  ⚡ Client connected    [${id}]`);

  const initialData = generateSensorData();
  socket.emit('sensorData', {
    data:  initialData,
    gpio:  state.gpioState,
    log:   state.simulationLog.slice(0, 15),
  });

  socket.on('disconnect', () => {
    console.log(`  ✕ Client disconnected [${id}]`);
  });
});

startSimulation(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        IotSimX Backend — Ready         ║');
  console.log('╚════════════════════════════════════════╝\n');
});