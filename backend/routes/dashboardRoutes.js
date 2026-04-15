// ─── Dashboard Routes ─────────────────────────────────────────────────────────
// GET  /api/dashboard        → snapshot for initial Dashboard load
//                              (stat cards + chart history + last log entries)

const express = require('express');
const router  = express.Router();
const state   = require('../state');

// ── GET /api/dashboard ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const historyLimit = parseInt(req.query.history, 10) || 15;

  // Last known sensor values
  const lastTemp   = state.sensorHistory.temperature.slice(-1)[0] || null;
  const lastLight  = state.sensorHistory.light.slice(-1)[0] || null;
  const lastMotion = state.sensorHistory.motion.slice(-1)[0] || null;

  res.json({
    latest: {
      temperature: lastTemp  ? lastTemp.value  : null,
      light:       lastLight ? lastLight.value : null,
      motion:      lastMotion ? Boolean(lastMotion.value) : null,
    },
    history: {
      temperature: state.sensorHistory.temperature.slice(-historyLimit),
      light:       state.sensorHistory.light.slice(-historyLimit),
      motion:      state.sensorHistory.motion.slice(-historyLimit),
    },
    log:   state.simulationLog.slice(0, 20),
    stats: {
      running:       state.simulationRunning,
      speedLabel:    state.speedLabel,
      activeSensors: state.getActiveSensorCount(),
      uptimeSeconds: state.getUptimeSeconds(),
    },
  });
});

module.exports = router;
