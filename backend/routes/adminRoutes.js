// ─── Admin Routes ─────────────────────────────────────────────────────────────
// GET  /api/admin/status   → full system status (running, speed, sensors, GPIO, log count, uptime)
// POST /api/admin/toggle   → pause / resume simulation
// POST /api/admin/speed    → set speed: 'slow'|'normal'|'fast'
// POST /api/admin/reset    → reset everything to defaults
// GET  /api/admin/log      → full event log (paginated)
// GET  /api/admin/alerts   → alert-only log
// GET  /api/admin/export   → download full snapshot as JSON
// POST /api/simulate       → trigger a single manual tick

const express   = require('express');
const router    = express.Router();
const state     = require('../state');
const { generateSensorData, startSimulation } = require('../simulation');

// The io instance is attached at app-level and passed via res.locals or req.app.get
// We use req.app.get('io') — set in index.js with app.set('io', io)

// ── GET /api/admin/status ─────────────────────────────────────────────────────
// Full status needed by Admin page for initial load
router.get('/status', (req, res) => {
  res.json({
    running:       state.simulationRunning,
    speed:         state.simulationSpeed,
    speedLabel:    state.speedLabel,                     // 'slow'|'normal'|'fast'
    activeSensors: state.getActiveSensorCount(),
    logCount:      state.simulationLog.length,
    alertCount:    state.alertLog.length,
    uptimeSeconds: state.getUptimeSeconds(),
    sensors:       state.sensorConfig,                  // for Admin sensor toggles
    gpio:          state.gpioState,
  });
});

// ── POST /api/admin/toggle ────────────────────────────────────────────────────
router.post('/toggle', (req, res) => {
  state.simulationRunning = !state.simulationRunning;
  const running = state.simulationRunning;
  state.logEvent(`Simulation ${running ? 'RESUMED ▶' : 'PAUSED ⏸'}`);
  res.json({
    running,
    speedLabel: state.speedLabel,
    activeSensors: state.getActiveSensorCount(),
  });
});

// ── POST /api/admin/speed ─────────────────────────────────────────────────────
// Body: { speed: 'slow'|'normal'|'fast' }
router.post('/speed', (req, res) => {
  const { speed } = req.body;
  const speedMap = { slow: 4000, normal: 2000, fast: 500 };
  if (!speedMap[speed]) {
    return res.status(400).json({ error: `Invalid speed: ${speed}. Use slow|normal|fast` });
  }

  state.simulationSpeed = speedMap[speed];
  state.speedLabel      = speed;
  state.logEvent(`Simulation speed → ${speed} (${speedMap[speed]}ms)`);

  const io = req.app.get('io');
  startSimulation(io);

  res.json({ success: true, speed, ms: speedMap[speed] });
});

// ── POST /api/admin/reset ─────────────────────────────────────────────────────
router.post('/reset', (req, res) => {
  state.resetState();
  state.simulationSpeed = 2000;
  state.speedLabel      = 'normal';
  state.simulationRunning = true;

  const io = req.app.get('io');
  startSimulation(io);

  res.json({ success: true, message: 'System reset to defaults' });
});

// ── GET /api/admin/log ────────────────────────────────────────────────────────
// Query params: ?limit=50&offset=0&level=alert
router.get('/log', (req, res) => {
  const limit  = parseInt(req.query.limit,  10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;
  const level  = req.query.level; // optional filter: 'alert' | 'info'

  let logs = state.simulationLog;
  if (level) logs = logs.filter(e => e.level === level);
  res.json(logs.slice(offset, offset + limit));
});

// ── GET /api/admin/alerts ─────────────────────────────────────────────────────
router.get('/alerts', (req, res) => {
  res.json(state.alertLog);
});

// ── GET /api/admin/export ─────────────────────────────────────────────────────
router.get('/export', (req, res) => {
  res.json({
    exportedAt:   new Date().toISOString(),
    uptime:       state.getUptimeSeconds(),
    config:       state.sensorConfig,
    gpio:         state.gpioState,
    history:      state.sensorHistory,
    log:          state.simulationLog,
    alerts:       state.alertLog,
    simulation: {
      running:    state.simulationRunning,
      speedLabel: state.speedLabel,
      speedMs:    state.simulationSpeed,
    },
  });
});

// ── POST /api/simulate ────────────────────────────────────────────────────────
// Manual single-tick — used by Simulator and Dashboard "STEP" button
router.post('/tick', (req, res) => {
  const io   = req.app.get('io');
  const data = generateSensorData();
  io.emit('sensorData', {
    data,
    gpio: state.gpioState,
    log:  state.simulationLog.slice(0, 15),
  });
  res.json({ success: true, data });
});

module.exports = router;
