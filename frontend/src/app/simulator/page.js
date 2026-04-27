'use client';
import '@xyflow/react/dist/style.css';
import {
  ReactFlow, ReactFlowProvider, addEdge, Background, BackgroundVariant, Controls,
  useNodesState, useEdgesState, useReactFlow
} from '@xyflow/react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { io } from 'socket.io-client';

import { SensorNode, CATALOG } from '@/components/simulator/nodes/SensorNode';
import { MicrocontrollerNode } from '@/components/simulator/nodes/MicrocontrollerNode';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000');

// ─── Theme-aware CSS variable reader ─────────────────────────────────────────
// Returns a live obj of --sim-* values that updates when data-theme changes
function useTheme() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(t);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const v = (dark, light) => theme === 'light' ? light : dark;

  return {
    theme,
    bg:          v('#0a0a0a', '#f0f0ec'),
    bg2:         v('#0d0d0d', '#e8e8e4'),
    bg3:         v('#080808', '#dcdcda'),
    bg4:         v('#050505', '#ececea'),
    bg5:         v('#000000', '#f8f8f6'),
    panelBg:     v('#111111', '#e0e0dc'),
    border:      v('#1a1a1a', '#cccccc'),
    border2:     v('#222222', '#bbbbbb'),
    border3:     v('#333333', '#aaaaaa'),
    border4:     v('#2a2a3e', '#9090b0'),
    text:        v('#cccccc', '#1a1a1a'),
    text2:       v('#888888', '#555555'),
    text3:       v('#555555', '#777777'),
    text4:       v('#444444', '#888888'),
    text5:       v('#333333', '#999999'),
    tabBg:       v('#1a1a2e', '#d8d8f0'),
    legendBg:    v('rgba(0,0,0,0.88)',         'rgba(240,240,236,0.96)'),
    compBg:      v('rgba(0,0,0,0.92)',         'rgba(236,236,234,0.96)'),
    toolbarBg:   v('#0d0d0d', '#e4e4e0'),
    editorHdr:   v('#0a0a0a', '#d8d8d4'),
    terminalBg:  v('#000000', '#1a1a2a'),
    editorTheme: v('vs-dark', 'light'),
    canvasColor: v('#1a1a1a', '#cccccc'),
    wireIdle:    v('#555555', '#888888'),
  };
}

const nodeTypes = {
  raspberrypi:    MicrocontrollerNode,
  microcontroller: MicrocontrollerNode,
  sensor:          SensorNode,
  breadboard:      MicrocontrollerNode,  // legacy saved circuits
};

const getDeviceImg = (type) => {
  const images = {
    arduino: '/devices/arduino_uno.png',
  };
  return images[type] || `/devices/${type}.png`;
};

// ─── Default template code (simulation blocked if this or empty) ──────────────
const DEFAULT_CODE = `# MR ENGINEER - ESP32/Pico Logic\n\ndef setup():\n    print('System Initialized...')\n\ndef loop():\n    val = read_sensor('D32')\n    print(f'Value: {val}')`;

function isCodeEmpty(code) {
  if (!code) return true;
  const trimmed = code.trim();
  if (trimmed === '') return true;
  // Check if it's exactly the default template
  if (trimmed === DEFAULT_CODE.trim()) return true;
  return false;
}

// ─── Buzzer Web Audio beep ────────────────────────────────────────────────────
let buzzerOscillators = {};
function startBuzzerSound(id) {
  if (buzzerOscillators[id]) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    buzzerOscillators[id] = { osc, ctx };
  } catch (e) { /* AudioContext blocked */ }
}
function stopBuzzerSound(id) {
  if (!buzzerOscillators[id]) return;
  try {
    buzzerOscillators[id].osc.stop();
    buzzerOscillators[id].ctx.close();
  } catch (e) {}
  delete buzzerOscillators[id];
}
function stopAllBuzzers() {
  Object.keys(buzzerOscillators).forEach(stopBuzzerSound);
}

// ─── Palette Item ─────────────────────────────────────────────────────────────
function PaletteItem({ type, category }) {
  const t = useTheme();
  let label = '', color = '#555';
  if (category === 'mcu' || category === 'board') {
    if (type === 'raspberrypi') { label = 'Raspberry Pi 4B'; color = '#3fa83f'; }
    else if (type === 'esp32')  { label = 'ESP32 WROOM-32';  color = '#f59e0b'; }
    else if (type === 'pico')   { label = 'RP2040 Pico';     color = '#00ff88'; }
    else if (type === 'arduino'){ label = 'Arduino Uno R3';  color = '#00aaff'; }
    else if (type === 'breadboard') { label = 'ESP32 Board'; color = '#f59e0b'; }
  } else {
    const cat = CATALOG[type] || { label: type, color: '#ff5500' };
    label = cat.label; color = cat.color;
  }
  const imgSrc = getDeviceImg(type);
  return (
    <div
      draggable
      onDragStart={e => {
        // All MCU boards use microcontroller node type
        const mcuTypes = ['raspberrypi', 'pico', 'esp32', 'arduino'];
        const flowType = mcuTypes.includes(type) ? 'microcontroller' : 'sensor';
        e.dataTransfer.setData('type', flowType);
        e.dataTransfer.setData('subType', type);
        e.dataTransfer.setData('imgSrc', imgSrc);
      }}
      style={{
        borderLeft: `3px solid ${color}`, background: t.theme === 'light' ? `${color}15` : `${color}0a`,
        border: `1px solid ${color}30`, padding: '8px', cursor: 'grab', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 10, borderRadius: '0 4px 4px 0',
        transition: 'all 0.15s', userSelect: 'none'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.theme === 'light' ? `${color}25` : `${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.background = t.theme === 'light' ? `${color}15` : `${color}0a`; }}
    >
      <div style={{ width: 34, height: 34, background: t.bg5, borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={imgSrc} alt={label} style={{ width: '90%', height: '90%', objectFit: 'contain' }}
          onError={e => { e.target.src = '/devices/sensor_generic.png'; }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem', color }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Live Component Status Panel ──────────────────────────────────────────────
function ComponentPanel({ nodes, edges, isRunning, sensorData }) {
  const t = useTheme();
  const sensorNodes = nodes.filter(n => n.type === 'sensor');
  if (sensorNodes.length === 0) return null;

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, zIndex: 100,
      background: t.compBg, border: `1px solid ${t.border2}`,
      borderRadius: 8, padding: '10px 14px', minWidth: 200, maxWidth: 280,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ fontSize: '0.6rem', color: t.text3, letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>
        COMPONENT STATUS
      </div>
      {sensorNodes.map(node => {
        const cat = CATALOG[node.data.sensorType] || {};
        const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
        const connectedHandles = connectedEdges.map(e => e.source === node.id ? e.sourceHandle : e.targetHandle);
        let reqHandles = ['vcc', 'gnd', 'signal'];
        if (node.data.sensorType === 'hcsr04') reqHandles = ['vcc', 'gnd', 'trig', 'echo'];
        else if (node.data.sensorType === 'bme280') reqHandles = ['vcc', 'gnd', 'sda', 'scl'];
        else if (node.data.sensorType === 'led')    reqHandles = ['gnd', 'signal'];
        const isWired = reqHandles.every(h => connectedHandles.includes(h));
        const hasError = connectedEdges.some(e => e.data?.isError);
        const isActive = isRunning && isWired && !hasError;

        const live = node.data.liveValue;
        const hasLive = live !== null && live !== undefined;

        let statusText = '⬤ IDLE';
        let statusColor = t.text4;
        if (!isWired && connectedEdges.length > 0) { statusText = '⚠ NOT WIRED'; statusColor = '#f59e0b'; }
        if (hasError) { statusText = '✕ WIRE ERROR'; statusColor = '#ef4444'; }
        if (isActive) {
          statusColor = cat.color || '#10b981';
          if (node.data.sensorType === 'led')    statusText = live ? '💡 ON' : '○ OFF';
          else if (node.data.sensorType === 'buzzer') statusText = live ? '🔔 BEEPING' : '○ IDLE';
          else if (node.data.sensorType === 'button') statusText = '🔘 ACTIVE';
          else if (hasLive) {
            if (typeof live === 'boolean') statusText = live ? '⬤ DETECTED' : '⬤ CLEAR';
            else statusText = `⬤ ${live}${cat.unit || ''}`;
          } else {
            statusText = '⬤ RUNNING';
          }
        }

        return (
          <div key={node.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5,
            padding: '4px 0', borderBottom: `1px solid ${t.border}`
          }}>
            <div style={{ fontSize: '1rem' }}>{cat.icon || '📦'}</div>
            <div>
              <div style={{ fontSize: '0.65rem', color: t.text2, fontWeight: 600 }}>{cat.label || node.data.sensorType}</div>
              <div style={{ fontSize: '0.65rem', color: statusColor, fontFamily: 'monospace', fontWeight: 700 }}>{statusText}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Simulator Canvas ────────────────────────────────────────────────────
function SimulatorCanvas() {
  const t = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [terminalLogs, setTerminalLogs] = useState(['> System Ready. Drag a controller & components to start.']);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [codeError, setCodeError] = useState('');

  // ── Panel collapse state ──
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [editorOpen,  setEditorOpen]  = useState(true);

  const terminalRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const buzzerNodeIds = useRef(new Set());

  // ── Socket connection ──
  useEffect(() => {
    const newSocket = io('http://localhost:4000');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // ── Auth redirect ──
  useEffect(() => {
    if (!loading && !user) router.push('/signup');
  }, [user, loading, router]);

  // ── Terminal auto-scroll ──
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLogs]);

  // ── Pass isRunning to all nodes so they can animate ──
  useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isRunning }
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // ── Buzzer management when running state changes ──
  useEffect(() => {
    if (!isRunning) {
      stopAllBuzzers();
      buzzerNodeIds.current.clear();
    }
  }, [isRunning]);

  // ── Socket data handler ──
  useEffect(() => {
    if (!socket || !isRunning) return;

    const handleSensorData = (payload) => {
      if (!payload?.data) return;

      const currentNodes = getNodes();
      const currentEdges = getEdges();

      // Find connected sensors and actuators
      const connectedKeys = [];
      const activeBuzzerIds = new Set();

      // Simple evaluator to process python logic for write_pin
      let pinStates = {};
      try {
        let currentCond = true;
        let inIfBlock = false;
        const lines = code.split('\n');
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('if ')) {
                let expr = trimmed.substring(3, trimmed.length - 1);
                expr = expr.replace(/temp/g, payload.data.temperature || 0)
                           .replace(/hum/g, payload.data.humidity || 0)
                           .replace(/distance/g, payload.data.distance || 0)
                           .replace(/gas/g, payload.data.gas || 0);
                try { currentCond = eval(expr); } catch(e) { currentCond = true; }
                inIfBlock = true;
            } else if (trimmed.startsWith('else:')) {
                currentCond = !currentCond;
            } else if (trimmed === '' || trimmed.startsWith('#')) {
                continue;
            } else if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed !== 'else:') {
                if (!trimmed.startsWith('def ')) {
                   currentCond = true;
                   inIfBlock = false;
                }
            }
            
            let wpMatch = trimmed.match(/write_pin\(['"](.*?)['"]\s*,\s*(\d+)\)/);
            if (wpMatch) {
                let pin = wpMatch[1].toLowerCase();
                let val = parseInt(wpMatch[2]) === 1;
                if (!inIfBlock || currentCond) {
                    pinStates[pin] = val;
                }
            }
        }
      } catch(e) {}

      currentNodes.forEach(node => {
        if (node.type !== 'sensor') return;
        const sType = node.data.sensorType;
        const cat = CATALOG[sType];
        if (!cat) return;

        // Determine required handles
        let reqHandles = ['vcc', 'gnd', 'signal'];
        if (sType === 'hcsr04') reqHandles = ['vcc', 'gnd', 'trig', 'echo'];
        else if (sType === 'bme280') reqHandles = ['vcc', 'gnd', 'sda', 'scl'];
        else if (sType === 'led')    reqHandles = ['gnd', 'signal'];

        const nodeEdges = currentEdges.filter(e => e.source === node.id || e.target === node.id);
        const nodeHandles = nodeEdges.map(e => e.source === node.id ? e.sourceHandle : e.targetHandle);
        const isFullyWired = reqHandles.every(h => nodeHandles.includes(h));
        const hasError = nodeEdges.some(e => e.data?.isError);

        if (!isFullyWired || hasError) return;

        let isOn = true;
        if (sType === 'led' || sType === 'buzzer') {
           const signalEdge = nodeEdges.find(e => {
               const h = e.source === node.id ? e.sourceHandle : e.targetHandle;
               return h === 'signal';
           });
           if (signalEdge) {
               const controllerPin = signalEdge.source === node.id ? signalEdge.targetHandle : signalEdge.sourceHandle;
               const p = controllerPin.toLowerCase();
               if (pinStates[p] !== undefined) {
                   isOn = pinStates[p];
               } else if (Object.keys(pinStates).length > 0) {
                   isOn = false; // if code has write_pin, default other pins to off
               }
           }
        }

        // ── Actuators: LED & Buzzer ──
        if (sType === 'led') {
          if (isOn) connectedKeys.push('led');
        } else if (sType === 'buzzer') {
          if (isOn) {
             activeBuzzerIds.add(node.id);
             connectedKeys.push('buzzer');
          }
        } else if (cat.dataKey) {
          connectedKeys.push(cat.dataKey);
        }
      });

      // Manage buzzer sounds
      // Start new buzzers
      activeBuzzerIds.forEach(id => {
        if (!buzzerNodeIds.current.has(id)) {
          startBuzzerSound(id);
          buzzerNodeIds.current.add(id);
        }
      });
      // Stop removed buzzers
      buzzerNodeIds.current.forEach(id => {
        if (!activeBuzzerIds.has(id)) {
          stopBuzzerSound(id);
          buzzerNodeIds.current.delete(id);
        }
      });

      // If nothing is connected, do not spam terminal
      if (connectedKeys.length === 0) return;

      // Filter sensor data
      const filteredData = {};
      for (const [k, v] of Object.entries(payload.data)) {
        if (connectedKeys.includes(k)) filteredData[k] = v;
      }

      // Add actuator states from GPIO (if connected)
      currentNodes.forEach(node => {
        if (node.type !== 'sensor') return;
        if (node.data.sensorType === 'led' || node.data.sensorType === 'buzzer') {
          const nodeEdges = currentEdges.filter(e => e.source === node.id || e.target === node.id);
          const signalEdge = nodeEdges.find(e => 
            (e.source === node.id && e.sourceHandle === 'signal') || 
            (e.target === node.id && e.targetHandle === 'signal')
          );
          if (signalEdge) {
            const mcuPin = signalEdge.source === node.id ? signalEdge.targetHandle : signalEdge.sourceHandle;
            const pinMatch = mcuPin?.match(/\d+/);
            if (pinMatch && payload.gpio) {
              const pinIndex = pinMatch[0];
              filteredData[node.data.sensorType] = (payload.gpio[pinIndex]?.state === 'HIGH');
            }
          }
        }
      });

      setSensorData(prev => ({ ...prev, ...filteredData }));

      // Update live values on all nodes
      setNodes(nds => nds.map(n => {
        // ── Case 1: Microcontroller Nodes ──
        if (n.type === 'microcontroller' || n.type === 'raspberrypi') {
          return { ...n, data: { ...n.data, gpioStates: payload.gpio } };
        }

        // ── Case 2: Sensor/Actuator Nodes ──
        if (n.type !== 'sensor' || !n.data?.sensorType) return n;
        const cat = CATALOG[n.data.sensorType];
        if (!cat) return n;

        // Find which pin this sensor is connected to
        const nodeEdges = currentEdges.filter(e => e.source === n.id || e.target === n.id);
        const signalEdge = nodeEdges.find(e => 
          (e.source === n.id && e.sourceHandle === 'signal') || 
          (e.target === n.id && e.targetHandle === 'signal')
        );

        let gpioValue = null;
        if (signalEdge && payload.gpio) {
          const mcuPin = signalEdge.source === n.id ? signalEdge.targetHandle : signalEdge.sourceHandle;
          if (mcuPin) {
            const pinMatch = mcuPin.match(/\d+/);
            const isPowerOrGnd = mcuPin.toLowerCase().includes('v') || mcuPin.toLowerCase().includes('gnd');
            if (pinMatch && !isPowerOrGnd) {
              const pinIndex = pinMatch[0];
              const pinState = payload.gpio[pinIndex]?.state;
              if (pinState) gpioValue = (pinState === 'HIGH');
            }
          }
        }

        // Actuators (LED/Buzzer)
        if (n.data.sensorType === 'led' || n.data.sensorType === 'buzzer') {
          return { ...n, data: { ...n.data, liveValue: gpioValue } };
        }

        // Sensors (DHT11, etc.)
        const dataKey = cat.dataKey;
        if (!dataKey || !connectedKeys.includes(dataKey)) {
          return { ...n, data: { ...n.data, liveValue: null } };
        }
        return { ...n, data: { ...n.data, liveValue: payload.data[dataKey] } };
      }));

      // Terminal log (MQTT style)
      if (Object.keys(filteredData).length > 0) {
        const currentData = Object.entries(filteredData)
          .map(([k, v]) => `${k}:${typeof v === 'boolean' ? (v ? '1' : '0') : v}`)
          .join(' | ');
        const mqttPayload = JSON.stringify(filteredData);
        setTerminalLogs(prev => {
          const last = prev[prev.length - 1] || '';
          if (last.includes('[MQTT PUBLISH]')) {
            return [...prev.slice(0, -2), `[LIVE] ${currentData}`, `> [MQTT] Topic: iot/live | ${mqttPayload}`];
          }
          return [...prev, `[LIVE] ${currentData}`, `> [MQTT] Topic: iot/live | ${mqttPayload}`];
        });
      }
    };

    socket.on('sensorData', handleSensorData);
    return () => socket.off('sensorData', handleSensorData);
  }, [socket, isRunning, getNodes, getEdges]);

  // ─── Save & Load ────────────────────────────────────────────────────────────
  const saveActivity = async (action, details) => {
    if (!user) return;
    try {
      await axios.post('http://localhost:4000/api/history/add', { userId: user.id, action, details });
    } catch (err) { console.error('Log error:', err); }
  };

  const handleSaveProject = async () => {
    if (!user) return alert('Please login first');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:4000/api/circuits', {
        id: currentProjectId,
        name: 'My Automated Project Workspace',
        nodes: getNodes(), edges: getEdges(), code
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.id) setCurrentProjectId(res.data.id);
      setTerminalLogs(prev => [...prev, '> [SYSTEM] Project saved to Cloud.']);
      saveActivity('Save Project', 'Workspace saved');
    } catch (err) {
      setTerminalLogs(prev => [...prev, '> [ERROR] Failed to save project.']);
    }
  };

  const handleLoadProject = async () => {
    if (!user) return alert('Please login first');
    try {
      const token = localStorage.getItem('token');
      const listRes = await axios.get('http://localhost:4000/api/circuits', { headers: { Authorization: `Bearer ${token}` } });
      if (listRes.data?.length > 0) {
        const res = await axios.get(`http://localhost:4000/api/circuits/${listRes.data[0].id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data?.data) {
          const { nodes: ln, edges: le, code: lc } = res.data.data;
          if (ln) setNodes(ln);
          if (le) setEdges(le);
          if (lc) setCode(lc);
          setCurrentProjectId(listRes.data[0].id);
          setTerminalLogs(prev => [...prev, `> [SYSTEM] Loaded: ${res.data.name}`]);
        }
      } else {
        setTerminalLogs(prev => [...prev, '> [SYSTEM] No saved projects found.']);
      }
    } catch (err) {
      setTerminalLogs(prev => [...prev, '> [ERROR] Failed to load project.']);
    }
  };

  // ─── UPLOAD & RUN — with code gate ─────────────────────────────────────────
  const handleRunCode = () => {
    if (isRunning) {
      setIsRunning(false);
      stopAllBuzzers();
      buzzerNodeIds.current.clear();
      setTerminalLogs(prev => [...prev, '> Simulation Terminated.', '> System Standby.']);
      saveActivity('Stop Simulation', 'User reset.');
      setEdges(eds => eds.map(e => ({
        ...e, animated: false,
        style: { stroke: e.data?.isError ? '#ef4444' : t.wireIdle, strokeWidth: e.data?.isError ? 3 : 2 }
      })));
      // Clear live values
      setNodes(nds => nds.map(n => n.type === 'sensor' ? { ...n, data: { ...n.data, liveValue: null } } : n));
      return;
    }

    // ── CODE GATE ──
    if (isCodeEmpty(code)) {
      setCodeError('⚠ Write code in the editor first! Simulation requires a program to run.');
      setTerminalLogs(prev => [...prev, '> [ERROR] No code found. Write a program to start simulation.']);
      setTimeout(() => setCodeError(''), 5000);
      return;
    }
    setCodeError('');

    // Check if any components are placed
    const currentNodes = getNodes();
    if (currentNodes.length === 0) {
      setTerminalLogs(prev => [...prev, '> [WARNING] No components on canvas. Add a controller and sensors.']);
      return;
    }

    setTerminalLogs(prev => [...prev, '> Validating Hardware...', '> Compiling code...', '> Flashing firmware...']);

    setTimeout(() => {
      setIsRunning(true);
      setTerminalLogs(prev => [
        ...prev,
        '> SUCCESS: Firmware uploaded. Controller is live.',
        '> Connecting to sensor data stream...',
        '> Running...'
      ]);
      saveActivity('Run Simulation', 'Execution started');
      setEdges(eds => eds.map(e => ({
        ...e, animated: !e.data?.isError,
        style: { stroke: e.data?.isError ? '#ef4444' : '#3b82f6', strokeWidth: 3 }
      })));
    }, 1800);
  };

  // ─── Wire Connection ────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/preserve-manual-memoization
  const onConnect = useCallback((params) => {
    const srcPin = (params.sourceHandle || '').toLowerCase();
    const tgtPin = (params.targetHandle || '').toLowerCase();
    const powerPins  = ['vcc', '3v3', '5v', '3.3v', 'vin'];
    const isSrcPower  = powerPins.includes(srcPin);
    const isTgtPower  = powerPins.includes(tgtPin);
    const isSrcGnd    = srcPin.startsWith('gnd') || srcPin === 'ground';
    const isTgtGnd    = tgtPin.startsWith('gnd') || tgtPin === 'ground';
    const isSrcSignal = !isSrcPower && !isSrcGnd;
    const isTgtSignal = !isTgtPower && !isTgtGnd;

    let hasError = false, errorMsg = '';

    if ((isSrcPower && isTgtGnd) || (isTgtPower && isSrcGnd)) {
      hasError = true; errorMsg = 'Short Circuit! Power to Ground.';
    } else if ((isSrcPower && isTgtSignal) || (isTgtPower && isSrcSignal)) {
      hasError = true; errorMsg = 'Invalid! Power to Signal pin.';
    } else if ((isSrcGnd && isTgtSignal) || (isTgtGnd && isSrcSignal)) {
      hasError = true; errorMsg = 'Invalid! GND to Signal pin.';
    } else {
      const nl = getNodes();
      const sn = nl.find(n => n.id === params.source);
      const tn = nl.find(n => n.id === params.target);
      if (sn?.type === 'sensor' && tn?.type === 'sensor') {
        hasError = true; errorMsg = 'Cannot connect two sensors directly.';
      }
    }

    const currentEdges = getEdges();
    const isPinOccupied = (nodeId, handleId, isSignal) => {
      if (!isSignal) return false;
      return currentEdges.some(e =>
        (e.source === nodeId && e.sourceHandle === handleId) ||
        (e.target === nodeId && e.targetHandle === handleId)
      );
    };
    if (!hasError && isPinOccupied(params.source, params.sourceHandle, isSrcSignal)) {
      hasError = true; errorMsg = `Pin ${params.sourceHandle?.toUpperCase()} already in use.`;
    }
    if (!hasError && isPinOccupied(params.target, params.targetHandle, isTgtSignal)) {
      hasError = true; errorMsg = `Pin ${params.targetHandle?.toUpperCase()} already in use.`;
    }

    // ── Wire color by pin type ──
    const pinColor = (pin) => {
      if (['vcc','3v3','5v','3.3v','vin','vbus','vsys'].includes(pin)) return '#ef4444';  // red — power
      if (pin.startsWith('gnd') || pin === 'ground')                    return '#6b7280';  // gray — GND
      if (['sda','scl'].includes(pin))                                  return '#10b981';  // teal — I2C
      if (['mosi','miso','sclk','ce0','ce1','sck'].includes(pin))       return '#06b6d4';  // cyan — SPI
      if (['tx','rx','tx0','rx0','tx1','rx1','tx2','rx2','txd','rxd'].includes(pin)) return '#f59e0b'; // amber — UART
      if (['trig','echo'].includes(pin))                                return '#a855f7';  // violet
      return '#3b82f6'; // blue — default signal
    };

    const wireColor = hasError ? '#ef4444' : pinColor(srcPin);

    setEdges(eds => addEdge({
      ...params,
      data:     { isError: hasError, srcPin, tgtPin },
      type:     'smoothstep',
      style:    { stroke: wireColor, strokeWidth: hasError ? 3 : 2.5, opacity: 0.9 },
      animated: isRunning && !hasError,
      label:    hasError ? '⚠' : undefined,
      labelStyle: { fill: '#ef4444', fontSize: 12 },
      markerEnd: { type: 'arrowclosed', width: 14, height: 14, color: wireColor },
    }, eds));
    saveActivity('Connect Wire', `Wired ${srcPin} → ${tgtPin}`);
  }, [setEdges, isRunning, getNodes, getEdges]);

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/preserve-manual-memoization
  const onDrop = useCallback(e => {
    e.preventDefault();
    const type    = e.dataTransfer.getData('type');
    const subType = e.dataTransfer.getData('subType');
    const imgSrc  = e.dataTransfer.getData('imgSrc');
    if (!type) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes(nds => [...nds, {
      id: `node_${Date.now()}`, type, position,
      data: { imgSrc, sensorType: subType, boardType: subType, active: isRunning, isRunning }
    }]);
    saveActivity('Add Component', `Added ${subType || type}`);
  }, [screenToFlowPosition, setNodes, isRunning]);

  const currentNodes = nodes; // for ComponentPanel

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', flexDirection: 'column', background: t.bg }}>

      {/* ── TOOLBAR ── */}
      <div style={{ height: 44, borderBottom: `1px solid ${t.border}`, background: t.toolbarBg, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace', color: '#3b82f6', letterSpacing: '1px' }}>
          MR_ENGINEER_SIM v2.1
        </div>
        {isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 1s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>SIMULATION LIVE</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={handleSaveProject}
          style={{ height: 30, padding: '0 14px', borderRadius: 4, border: '1px solid #3b82f640', background: '#0f1a2e', color: '#3b82f6', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600, fontFamily: 'monospace' }}>
          SAVE
        </button>
        <button onClick={handleLoadProject}
          style={{ height: 30, padding: '0 14px', borderRadius: 4, border: `1px solid ${t.border}`, background: t.bg2, color: t.text2, fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'monospace' }}>
          LOAD
        </button>
        <button onClick={handleRunCode}
          style={{
            height: 30, padding: '0 18px', borderRadius: 4, border: 'none', cursor: 'pointer',
            background: isRunning ? '#7f1d1d' : '#1d4ed8', color: '#fff',
            fontWeight: 700, fontSize: '0.7rem', fontFamily: 'monospace',
            boxShadow: isRunning ? '0 0 12px #ef444455' : '0 0 12px #3b82f655',
            transition: 'all 0.2s'
          }}>
          {isRunning ? '⬛ RESET SYSTEM' : '▶ UPLOAD & RUN'}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── PALETTE ── */}
        <div style={{
          width: paletteOpen ? 210 : 0,
          minWidth: 0,
          borderRight: paletteOpen ? `1px solid ${t.border}` : 'none',
          background: t.bg3,
          overflowY: paletteOpen ? 'auto' : 'hidden',
          overflowX: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
          position: 'relative',
        }}>
          {paletteOpen && (
            <div style={{ width: 210, padding: '10px 8px', paddingTop: 36 }}>
              <div style={{ fontSize: '0.55rem', color: t.text3, marginBottom: 8, letterSpacing: '1.5px', fontWeight: 700, fontFamily: 'monospace' }}>CORE CONTROLLERS</div>
              <PaletteItem category="mcu" type="esp32" />
              <PaletteItem category="mcu" type="pico" />
              <PaletteItem category="mcu" type="raspberrypi" />
              <PaletteItem category="mcu" type="arduino" />

              <div style={{ fontSize: '0.55rem', color: t.text3, marginTop: 16, marginBottom: 8, letterSpacing: '1.5px', fontWeight: 700, fontFamily: 'monospace' }}>SENSORS</div>
              {['dht11', 'pir', 'ldr', 'hcsr04', 'mq2', 'mq3', 'mq4', 'dht22', 'bme280', 'ky037', 'moisture'].map(k =>
                <PaletteItem key={k} category="sensor" type={k} />
              )}

              <div style={{ fontSize: '0.55rem', color: t.text3, marginTop: 16, marginBottom: 8, letterSpacing: '1.5px', fontWeight: 700, fontFamily: 'monospace' }}>ACTUATORS</div>
              {['led', 'buzzer', 'button'].map(k =>
                <PaletteItem key={k} category="sensor" type={k} />
              )}
            </div>
          )}
        </div>

        {/* Palette toggle tab — always visible on left edge of canvas */}
        <button
          onClick={() => setPaletteOpen(o => !o)}
          title={paletteOpen ? 'Collapse palette' : 'Open palette'}
          style={{
            position: 'absolute', left: paletteOpen ? 210 : 0, top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 200,
            width: 18, height: 72,
            background: t.tabBg,
            borderTop: `1px solid ${t.border4}`,
            borderRight: `1px solid ${t.border4}`,
            borderBottom: `1px solid ${t.border4}`,
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3b82f6', fontSize: '0.6rem', fontWeight: 900,
            transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.4)',
            writingMode: 'unset',
          }}
        >
          {paletteOpen ? '◀' : '▶'}
        </button>

        {/* ── CANVAS ── */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onDrop={onDrop} onDragOver={e => e.preventDefault()}
            nodeTypes={nodeTypes} fitView
            style={{ background: t.bg }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color={t.canvasColor} variant={BackgroundVariant.Dots} gap={20} />
            <Controls style={{ background: t.panelBg, border: `1px solid ${t.border2}` }} />
          </ReactFlow>

          {/* ── Component Status Panel ── */}
          <ComponentPanel nodes={currentNodes} edges={edges} isRunning={isRunning} sensorData={sensorData} />

          {/* ── Wire Legend (bottom-right of canvas) ── */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 100,
            background: t.legendBg, border: `1px solid ${t.border}`,
            borderRadius: 8, padding: '8px 12px',
            backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: '0.5rem', color: t.text4, letterSpacing: '1px', fontWeight: 700, marginBottom: 3 }}>WIRE LEGEND</div>
            {[
              { color: '#ef4444', label: 'POWER (VCC/5V/3V3)' },
              { color: '#6b7280', label: 'GROUND (GND)' },
              { color: '#3b82f6', label: 'SIGNAL / DATA' },
              { color: '#10b981', label: 'I2C (SDA/SCL)' },
              { color: '#06b6d4', label: 'SPI' },
              { color: '#f59e0b', label: 'UART (TX/RX)' },
              { color: '#ef4444', label: 'ERROR', dash: true },
            ].map(({ color, label, dash }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 22, height: 2, background: color, borderRadius: 2,
                  border: dash ? `1px dashed ${color}` : 'none',
                  boxShadow: `0 0 4px ${color}55`
                }} />
                <span style={{ fontSize: '0.55rem', color: t.text3, fontFamily: 'monospace' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: '0.5rem', color: t.text5, fontFamily: 'monospace' }}>Select wire + Delete to remove</div>
          </div>

          {/* ── Empty Canvas Hint ── */}
          {nodes.length === 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              textAlign: 'center', pointerEvents: 'none', userSelect: 'none'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔌</div>
              <div style={{ color: t.text5, fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>
                Drag components from the left panel
              </div>
              <div style={{ color: t.text4, fontSize: '0.72rem', fontFamily: 'monospace', marginTop: 6 }}>
                Connect them with wires, write code, then UPLOAD & RUN
              </div>
            </div>
          )}
        </div>

        {/* Editor toggle tab — on right edge of canvas */}
        <button
          onClick={() => setEditorOpen(o => !o)}
          title={editorOpen ? 'Collapse editor' : 'Open editor'}
          style={{
            position: 'absolute',
            right: editorOpen ? 400 : 0,
            top: '50%', transform: 'translateY(-50%)',
            zIndex: 200,
            width: 18, height: 72,
            background: t.tabBg,
            borderTop: `1px solid ${t.border4}`,
            borderLeft: `1px solid ${t.border4}`,
            borderBottom: `1px solid ${t.border4}`,
            borderRadius: '6px 0 0 6px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#3b82f6', fontSize: '0.6rem', fontWeight: 900,
            transition: 'right 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.4)',
          }}
        >
          {editorOpen ? '▶' : '◀'}
        </button>

        {/* ── CODE EDITOR + TERMINAL ── */}
        <div style={{
          width: editorOpen ? 400 : 0,
          minWidth: 0,
          background: t.bg4,
          display: 'flex', flexDirection: 'column',
          borderLeft: editorOpen ? `1px solid ${t.border}` : 'none',
          overflowX: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
        }}>
          {editorOpen && (
            <>
              {/* Editor header */}
              <div style={{ height: 32, background: t.editorHdr, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <div style={{ fontSize: '0.62rem', color: t.text4, fontFamily: 'monospace', marginLeft: 8 }}>main.py</div>
                <div style={{ flex: 1 }} />
                {isCodeEmpty(code) && (
                  <div style={{ fontSize: '0.58rem', color: '#f59e0b', fontFamily: 'monospace', fontWeight: 700 }}>
                    ⚠ CODE REQUIRED
                  </div>
                )}
              </div>

              {/* Code gate error banner */}
              {codeError && (
                <div style={{
                  background: t.theme === 'light' ? '#ffebeb' : '#2d0a0a', border: '1px solid #ef444455', color: '#ef4444',
                  padding: '8px 12px', fontSize: '0.7rem', fontFamily: 'monospace',
                  fontWeight: 600, lineHeight: 1.4, flexShrink: 0,
                }}>
                  {codeError}
                </div>
              )}

              {/* Monaco editor */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <Editor
                  height="100%"
                  theme={t.editorTheme}
                  defaultLanguage="python"
                  value={code}
                  onChange={v => { setCode(v); if (codeError) setCodeError(''); }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    padding: { top: 10 },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontFamily: 'JetBrains Mono, Fira Code, monospace'
                  }}
                />
              </div>

              {/* Terminal */}
              <div ref={terminalRef} style={{ height: 190, flexShrink: 0, background: t.terminalBg, padding: '10px 12px', overflowY: 'auto', borderTop: `2px solid ${t.border2}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ color: '#3b82f6', fontSize: '0.58rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px' }}>
                    SERIAL MONITOR {isRunning && <span style={{ color: '#10b981' }}>● LIVE</span>}
                  </div>
                  <button
                    onClick={() => setTerminalLogs(['> System Ready.'])}
                    style={{ background: t.bg2, border: `1px solid ${t.border2}`, color: t.text2, fontSize: '0.58rem', cursor: 'pointer', padding: '2px 8px', borderRadius: 3, fontFamily: 'monospace' }}>
                    CLR
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                  {terminalLogs.map((log, i) => (
                    <div key={i} style={{
                      color: log.includes('SUCCESS') ? '#10b981'
                        : log.includes('[ERROR]') ? '#ef4444'
                        : log.includes('[WARNING]') ? '#f59e0b'
                        : log.includes('[LIVE]') ? '#3b82f6'
                        : log.includes('[MQTT]') ? '#8b5cf6'
                        : t.text2,
                      marginBottom: 2, lineHeight: 1.5
                    }}>
                      {log}
                    </div>
                  ))}
                  {isRunning && <span style={{ color: '#3b82f6', animation: 'blink 1s step-end infinite' }}>_</span>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function SimulatorPage() {
  return <ReactFlowProvider><SimulatorCanvas /></ReactFlowProvider>;
}