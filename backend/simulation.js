// ─── Simulation Engine ────────────────────────────────────────────────────────
const state = require('./state');
const MAX_HISTORY = 50;
const rnd = (min, max) => min + Math.random() * (max - min);

function generateSensorData() {
  const cfg  = state.sensorConfig;
  const hist = state.sensorHistory;
  const data = {};
  const now  = new Date().toLocaleTimeString();

  // ── Temperature  GPIO17 ────────────────────────────────────────────────────
  if (cfg.temperature.enabled) {
    data.temperature = +(rnd(cfg.temperature.min, cfg.temperature.max)).toFixed(1);
    const hot = data.temperature > 35;
    state.gpioState[17].state = hot ? 'HIGH' : 'LOW';
    state.logEvent(`[TEMP] ${data.temperature}°C → GPIO17 ${hot ? 'HIGH ⚠' : 'LOW ✓'}`);
    if (cfg.temperature.alertThreshold && data.temperature > cfg.temperature.alertThreshold)
      state.logEvent(`⚠ ALERT: Temperature ${data.temperature}°C > ${cfg.temperature.alertThreshold}°C`, 'alert');
    hist.temperature.push({ value: data.temperature, time: now });
    if (hist.temperature.length > MAX_HISTORY) hist.temperature.shift();
  } else { state.gpioState[17].state = 'LOW'; }

  // ── Motion  GPIO22 ─────────────────────────────────────────────────────────
  if (cfg.motion.enabled) {
    data.motion = Math.random() < cfg.motion.sensitivity;
    state.gpioState[22].state = data.motion ? 'HIGH' : 'LOW';
    if (data.motion) state.logEvent('[MOTION] DETECTED → GPIO22 HIGH ⚡', 'alert');
    hist.motion.push({ value: data.motion ? 1 : 0, time: now });
    if (hist.motion.length > MAX_HISTORY) hist.motion.shift();
  } else { state.gpioState[22].state = 'LOW'; }

  // ── Light  GPIO24 ──────────────────────────────────────────────────────────
  if (cfg.light.enabled) {
    data.light = Math.floor(rnd(100, 1000));
    const bright = data.light > cfg.light.threshold;
    state.gpioState[24].state = bright ? 'HIGH' : 'LOW';
    state.logEvent(`[LIGHT] ${data.light} lux → GPIO24 ${bright ? 'HIGH ☀' : 'LOW 🌙'}`);
    hist.light.push({ value: data.light, time: now });
    if (hist.light.length > MAX_HISTORY) hist.light.shift();
  } else { state.gpioState[24].state = 'LOW'; }

  // ── Distance (HC-SR04)  GPIO23 ────────────────────────────────────────────
  if (cfg.distance.enabled) {
    data.distance = Math.round(rnd(cfg.distance.min, cfg.distance.max));
    state.gpioState[23].state = data.distance < 50 ? 'HIGH' : 'LOW';
    state.logEvent(`[DIST] ${data.distance} cm → GPIO23`);
    hist.distance.push({ value: data.distance, time: now });
    if (hist.distance.length > MAX_HISTORY) hist.distance.shift();
  } else { state.gpioState[23].state = 'LOW'; }

  // ── Gas (MQ-2)  GPIO27 ────────────────────────────────────────────────────
  if (cfg.gas.enabled) {
    data.gas = Math.round(rnd(cfg.gas.min, cfg.gas.max));
    const danger = data.gas > 300;
    state.gpioState[27].state = danger ? 'HIGH' : 'LOW';
    if (danger) state.logEvent(`⚠ ALERT: Gas ${data.gas} ppm → GPIO27 HIGH`, 'alert');
    else        state.logEvent(`[GAS] ${data.gas} ppm → GPIO27`);
    hist.gas.push({ value: data.gas, time: now });
    if (hist.gas.length > MAX_HISTORY) hist.gas.shift();
  } else { state.gpioState[27].state = 'LOW'; }

  // ── Humidity (DHT22)  GPIO18 ───────────────────────────────────────────────
  if (cfg.humidity.enabled) {
    data.humidity = +(rnd(cfg.humidity.min, cfg.humidity.max)).toFixed(1);
    state.gpioState[18].state = data.humidity > 70 ? 'HIGH' : 'LOW';
    hist.humidity.push({ value: data.humidity, time: now });
    if (hist.humidity.length > MAX_HISTORY) hist.humidity.shift();
  } else { state.gpioState[18].state = 'LOW'; }

  // ── Pressure (BME280)  I2C GPIO2/3 ─────────────────────────────────────────
  if (cfg.pressure.enabled) {
    data.pressure = Math.round(rnd(cfg.pressure.min, cfg.pressure.max));
    state.gpioState[2].state = 'HIGH'; // I2C active
    state.gpioState[3].state = 'HIGH';
    hist.pressure.push({ value: data.pressure, time: now });
    if (hist.pressure.length > MAX_HISTORY) hist.pressure.shift();
  }

  // ── Sound (KY-037)  GPIO25 ─────────────────────────────────────────────────
  if (cfg.sound.enabled) {
    data.sound = Math.random() < cfg.sound.sensitivity;
    state.gpioState[25].state = data.sound ? 'HIGH' : 'LOW';
    if (data.sound) state.logEvent('[SOUND] Detected → GPIO25 HIGH');
    hist.sound.push({ value: data.sound ? 1 : 0, time: now });
    if (hist.sound.length > MAX_HISTORY) hist.sound.shift();
  } else { state.gpioState[25].state = 'LOW'; }

  return data;
}

let simInterval = null;

function startSimulation(io) {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(() => {
    if (!state.simulationRunning) return;
    const data = generateSensorData();
    io.emit('sensorData', {
      data,
      gpio: state.gpioState,
      log:  state.simulationLog.slice(0, 15),
    });
  }, state.simulationSpeed);
}

function stopSimulation() {
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
}

module.exports = { generateSensorData, startSimulation, stopSimulation };
