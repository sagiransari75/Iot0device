// ─── Shared In-Memory State ──────────────────────────────────────────────────
let simulationRunning = true;
let simulationSpeed   = 2000;
let speedLabel        = 'normal';
let startedAt         = Date.now();

let sensorConfig = {
  temperature: { enabled: true, min: 20, max: 45, alertThreshold: 38 },
  motion:      { enabled: true, sensitivity: 0.3 },
  light:       { enabled: true, threshold: 500 },
  distance:    { enabled: true, min: 5, max: 400 },
  gas:         { enabled: true, min: 50, max: 500 },
  humidity:    { enabled: true, min: 30, max: 90 },
  pressure:    { enabled: true, min: 980, max: 1050 },
  sound:       { enabled: true, sensitivity: 0.20 },
};

// All 40 BCM GPIO pins tracked
let gpioState = {
  0:  { type: 'ID_SD', state: 'LOW', note: 'I2C EEPROM SDA' },
  1:  { type: 'ID_SC', state: 'LOW', note: 'I2C EEPROM SCL' },
  2:  { type: 'SDA',   state: 'LOW', note: 'I2C SDA'        },
  3:  { type: 'SCL',   state: 'LOW', note: 'I2C SCL'        },
  4:  { type: 'GPIO',  state: 'LOW', note: 'GPCLK0'         },
  5:  { type: 'GPIO',  state: 'LOW', note: 'General'        },
  6:  { type: 'GPIO',  state: 'LOW', note: 'General'        },
  7:  { type: 'SPI',   state: 'LOW', note: 'SPI CE1'        },
  8:  { type: 'SPI',   state: 'LOW', note: 'SPI CE0'        },
  9:  { type: 'SPI',   state: 'LOW', note: 'SPI MISO'       },
  10: { type: 'SPI',   state: 'LOW', note: 'SPI MOSI'       },
  11: { type: 'SPI',   state: 'LOW', note: 'SPI CLK'        },
  12: { type: 'PWM',   state: 'LOW', note: 'PWM0'           },
  13: { type: 'PWM',   state: 'LOW', note: 'PWM1'           },
  14: { type: 'UART',  state: 'LOW', note: 'UART TXD'       },
  15: { type: 'UART',  state: 'LOW', note: 'UART RXD'       },
  16: { type: 'GPIO',  state: 'LOW', note: 'General'        },
  17: { type: 'GPIO',  state: 'LOW', note: 'Temp Sensor'    },
  18: { type: 'PWM',   state: 'LOW', note: 'PWM0/PCM_CLK'  },
  19: { type: 'SPI',   state: 'LOW', note: 'SPI1 MISO'      },
  20: { type: 'SPI',   state: 'LOW', note: 'SPI1 MOSI'      },
  21: { type: 'SPI',   state: 'LOW', note: 'SPI1 CLK'       },
  22: { type: 'GPIO',  state: 'LOW', note: 'Motion Sensor'  },
  23: { type: 'GPIO',  state: 'LOW', note: 'Ultrasonic Echo'},
  24: { type: 'GPIO',  state: 'LOW', note: 'Light Sensor'   },
  25: { type: 'GPIO',  state: 'LOW', note: 'General'        },
  26: { type: 'GPIO',  state: 'LOW', note: 'General'        },
  27: { type: 'GPIO',  state: 'LOW', note: 'General'        },
};

let simulationLog  = [];
let alertLog       = [];
let sensorHistory  = {
  temperature: [], light: [], motion: [],
  distance: [], gas: [], humidity: [], pressure: [], sound: [],
};
const MAX_HISTORY = 50;
const MAX_LOG     = 100;

function logEvent(message, level = 'info') {
  const entry = { time: new Date().toLocaleTimeString(), message, level, ts: Date.now() };
  simulationLog.unshift(entry);
  if (simulationLog.length > MAX_LOG) simulationLog.pop();
  if (level === 'alert') {
    alertLog.unshift(entry);
    if (alertLog.length > 30) alertLog.pop();
  }
}

function getActiveSensorCount() {
  return Object.values(sensorConfig).filter(s => s.enabled).length;
}
function getUptimeSeconds() {
  return Math.floor((Date.now() - startedAt) / 1000);
}

function resetState() {
  sensorConfig = {
    temperature: { enabled: true, min: 20, max: 45, alertThreshold: 38 },
    motion:      { enabled: true, sensitivity: 0.3 },
    light:       { enabled: true, threshold: 500 },
    distance:    { enabled: true, min: 5, max: 400 },
    gas:         { enabled: true, min: 50, max: 500 },
    humidity:    { enabled: true, min: 30, max: 90 },
    pressure:    { enabled: true, min: 980, max: 1050 },
    sound:       { enabled: true, sensitivity: 0.20 },
  };
  sensorHistory = {
    temperature: [], light: [], motion: [],
    distance: [], gas: [], humidity: [], pressure: [], sound: [],
  };
  simulationLog = [];
  alertLog      = [];
  Object.keys(gpioState).forEach(k => { gpioState[k].state = 'LOW'; });
  logEvent('System reset by admin');
}

module.exports = {
  get simulationRunning() { return simulationRunning; },
  set simulationRunning(v) { simulationRunning = v; },
  get simulationSpeed()   { return simulationSpeed; },
  set simulationSpeed(v)  { simulationSpeed = v; },
  get speedLabel()        { return speedLabel; },
  set speedLabel(v)       { speedLabel = v; },
  get sensorConfig()      { return sensorConfig; },
  set sensorConfig(v)     { sensorConfig = v; },
  get gpioState()         { return gpioState; },
  get simulationLog()     { return simulationLog; },
  get alertLog()          { return alertLog; },
  get sensorHistory()     { return sensorHistory; },
  get startedAt()         { return startedAt; },
  logEvent,
  getActiveSensorCount,
  getUptimeSeconds,
  resetState,
};
