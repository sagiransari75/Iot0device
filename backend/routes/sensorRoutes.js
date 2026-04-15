// ─── Sensor Routes ────────────────────────────────────────────────────────────
// GET  /api/sensors          → current config + full history
// POST /api/sensors          → update one sensor's config
// GET  /api/sensors/history  → history only (for Dashboard restore on mount)
// GET  /api/gpio             → full GPIO pin-state map
// POST /api/gpio/:pin/connect→ assign a sensor to a pin

const express = require('express');
const router  = express.Router();
const state   = require('../state');

// ── GET /api/sensors ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({
    config:  state.sensorConfig,
    history: state.sensorHistory,
  });
});

// ── POST /api/sensors ─────────────────────────────────────────────────────────
// Body: { sensor: 'temperature'|'motion'|'light', config: { ... } }
router.post('/', (req, res) => {
  const { sensor, config } = req.body;
  if (!state.sensorConfig[sensor]) {
    return res.status(400).json({ error: `Unknown sensor: ${sensor}` });
  }

  // Validate temperature config
  if (sensor === 'temperature' && config.min !== undefined && config.max !== undefined) {
    if (+config.min >= +config.max) {
      return res.status(422).json({ error: 'min must be less than max' });
    }
  }

  state.sensorConfig[sensor] = { ...state.sensorConfig[sensor], ...config };
  state.logEvent(`Sensor config updated: ${sensor} → ${JSON.stringify(config)}`);

  res.json({ success: true, sensor, config: state.sensorConfig[sensor] });
});

// ── GET /api/sensors/history ──────────────────────────────────────────────────
// Used by Dashboard on mount to pre-fill charts with existing data
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  res.json({
    temperature: state.sensorHistory.temperature.slice(-limit),
    motion:      state.sensorHistory.motion.slice(-limit),
    light:       state.sensorHistory.light.slice(-limit),
  });
});

// ── GET /api/gpio ─────────────────────────────────────────────────────────────
router.get('/gpio', (req, res) => {
  res.json(state.gpioState);
});

// ── POST /api/gpio/:pin/connect ───────────────────────────────────────────────
router.post('/gpio/:pin/connect', (req, res) => {
  const pin = req.params.pin;
  const { sensor } = req.body;
  if (!state.gpioState[pin]) {
    return res.status(400).json({ error: `Invalid pin: ${pin}` });
  }
  state.gpioState[pin].sensor = sensor || null;
  state.logEvent(`GPIO${pin} connected to ${sensor || 'nothing'}`);
  res.json({ success: true, pin: state.gpioState[pin] });
});

module.exports = router;
