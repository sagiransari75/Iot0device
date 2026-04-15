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

// --- NODE IMPORTS ---
import { RaspberryPiNode } from '@/components/simulator/nodes/RaspberryPiNode';
import { SensorNode, CATALOG } from '@/components/simulator/nodes/SensorNode';
import { ESP32Node } from '@/components/simulator/nodes/Esp32Node'; 
import { MicrocontrollerNode } from '@/components/simulator/nodes/MicrocontrollerNode';

// --- NODE TYPES MAPPING ---
const nodeTypes = {
  raspberrypi: RaspberryPiNode,
  microcontroller: MicrocontrollerNode,
  sensor: SensorNode,
  breadboard: ESP32Node, 
};

// --- FIX: Image Paths ---
const getDeviceImg = (type) => {
  const images = {
    raspberrypi: '/devices/raspberrypi.png',
    esp32: '/devices/esp32.png',
    pico: '/devices/pico.png',
    breadboard: '/devices/esp32.png', 
    dht11: '/devices/dht11.png',
    pir: '/devices/pir.png',
  };
  return images[type] || '/devices/sensor_generic.png';
};

function PaletteItem({ type, category }) {
  let label = '', color = '#555';
  
  if (category === 'mcu' || category === 'board') {
    if (type === 'raspberrypi') { label = 'Raspberry Pi 4B'; color = '#3fa83f'; }
    else if (type === 'esp32')  { label = 'ESP32 WROOM'; color = '#3b82f6'; }
    else if (type === 'pico')   { label = 'RP2040 Pico'; color = '#00ff88'; }
    else if (type === 'breadboard') { label = 'ESP32 Controller'; color = '#3b82f6'; }
  } else {
    const cat = CATALOG[type] || { label: type, color: '#ff5500' };
    label = cat.label; color = cat.color;
  }
  
  const currentImgSrc = getDeviceImg(type);

  return (
    <div
      draggable
      onDragStart={e => {
        // Drop logic: 'pico' and 'raspberrypi' go as themselves, others as breadboard/sensor
        const flowType = (type === 'raspberrypi' || type === 'pico') ? 'microcontroller' : (category === 'board' || type === 'esp32' ? 'breadboard' : 'sensor');
        
        e.dataTransfer.setData('type', flowType);
        e.dataTransfer.setData('subType', type);
        e.dataTransfer.setData('imgSrc', currentImgSrc);
      }}
      style={{
        borderLeft: `3px solid ${color}`, background: `${color}0a`,
        border: `1px solid ${color}30`, padding: '8px', cursor: 'grab', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 10, borderRadius: '0 4px 4px 0'
      }}
    >
      <div style={{ width: 34, height: 34, background: '#000', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={currentImgSrc} 
          alt={label} 
          style={{ width: '90%', height: '90%', objectFit: 'contain' }} 
          onError={(e) => { e.target.src = '/devices/sensor_generic.png'; }} // Fallback agar image na mile
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.75rem', color }}>{label}</div>
      </div>
    </div>
  );
}

function SimulatorCanvas() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();


  const [code, setCode] = useState("# MR ENGINEER - ESP32/Pico Logic\n\ndef setup():\n    print('System Initialized...')\n\ndef loop():\n    val = read_sensor('D32')\n    print(f'Value: {val}')");
  const [terminalLogs, setTerminalLogs] = useState(["> System Ready. Drag a controller to start."]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  const terminalRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !isRunning) return;
    const handleSensorData = (payload) => {
      if (payload && payload.data) {
        
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const connectedKeys = [];
        
        // Find which sensors are properly wired
        currentNodes.forEach(node => {
          if (node.type === 'sensor' && node.data.sensorType) {
            const dataKey = CATALOG[node.data.sensorType]?.dataKey;
            if (dataKey) {
               let requiredHandles = ['vcc', 'gnd', 'signal'];
               if (node.data.sensorType === 'hcsr04') requiredHandles = ['vcc', 'gnd', 'trig', 'echo'];
               else if (node.data.sensorType === 'bme280') requiredHandles = ['vcc', 'gnd', 'sda', 'scl'];
               
               const connectedHandles = currentEdges.map(e => e.source === node.id ? e.sourceHandle : e.targetHandle);
               const hasAllRequired = requiredHandles.every(h => connectedHandles.includes(h));
               const hasError = currentEdges.some(e => e.data?.isError);
               
               // Only include data if all required pins are wired correctly and no errors
               if (hasAllRequired && !hasError) {
                  connectedKeys.push(dataKey);
               }
            }
          }
        });

        // If nothing is connected, do not spam terminal
        if (connectedKeys.length === 0) return;

        // Filter the payload data for EXACTLY what is connected
        const filteredData = {};
        for (const [k, v] of Object.entries(payload.data)) {
           if (connectedKeys.includes(k)) {
              filteredData[k] = v;
           }
        }
        
        if (Object.keys(filteredData).length === 0) return;

        const currentData = Object.entries(filteredData)
            .map(([k, v]) => `${k}:${typeof v === 'boolean' ? (v?'1':'0') : v}`)
            .join(' | ');
        
        // Cloud & IoT Protocol (MQTT) Simulation
        const mqttPayload = JSON.stringify(filteredData);
        const activeMQTT = `> [MQTT PUBLISH] => Topic: "iot/live/telemetry" | Payload: ${mqttPayload}`;
        
        setTerminalLogs(prev => {
          const lastLog = prev[prev.length - 1] || '';
          if (lastLog.includes('[MQTT PUBLISH]')) {
            const cleanLogs = prev.slice(0, -2);
            return [...cleanLogs, `[LIVE] ${currentData}`, activeMQTT];
          } else {
            return [...prev, `[LIVE] ${currentData}`, activeMQTT];
          }
        });

        // Update live value in the nodes to show on the device visually
        setNodes(nds => nds.map(n => {
           if (n.type === 'sensor' && n.data?.sensorType) {
               const nodeDataKey = CATALOG[n.data.sensorType]?.dataKey;
               if (!nodeDataKey || !connectedKeys.includes(nodeDataKey)) {
                   return { ...n, data: { ...n.data, liveValue: null } };
               }
               return { ...n, data: { ...n.data, liveValue: payload.data[nodeDataKey] } };
           }
           return n;
        }));
      }
    };

    socket.on('sensorData', handleSensorData);
    return () => socket.off('sensorData', handleSensorData);
  }, [socket, isRunning, getNodes, getEdges]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLogs]);

  useEffect(() => {
    if (!loading && !user) router.push('/signup');
  }, [user, loading, router]);

  const saveActivity = async (action, details) => {
    if (!user) return;
    try {
      await axios.post('http://localhost:4000/api/history/add', {
        userId: user.id, action, details
      });
    } catch (err) { console.error("Log error:", err); }
  };

  const handleSaveProject = async () => {
    if (!user) return alert("Please login first");
    try {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const payload = {
        id: currentProjectId,
        name: "My Automated Project Workspace",
        nodes: currentNodes,
        edges: currentEdges,
        code: code
      };
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:4000/api/circuits', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.id) setCurrentProjectId(res.data.id);
      setTerminalLogs(prev => [...prev, "> [SYSTEM] Project workspace saved successfully to Cloud."]);
      saveActivity("Save Project", "Workspace saved");
    } catch (err) {
      console.error("Save error:", err);
      setTerminalLogs(prev => [...prev, "> [ERROR] Failed to save project."]);
    }
  };

  const handleLoadProject = async () => {
    if (!user) return alert("Please login first");
    try {
      const token = localStorage.getItem('token');
      // Fetch list of circuits
      const listRes = await axios.get('http://localhost:4000/api/circuits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.data && listRes.data.length > 0) {
         // load the most recent one
         const latestId = listRes.data[0].id;
         const res = await axios.get(`http://localhost:4000/api/circuits/${latestId}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         
         if (res.data && res.data.data) {
           const { nodes: loadedNodes, edges: loadedEdges, code: loadedCode } = res.data.data;
           if (loadedNodes) setNodes(loadedNodes);
           if (loadedEdges) setEdges(loadedEdges);
           if (loadedCode) setCode(loadedCode);
           
           setCurrentProjectId(latestId);
           setTerminalLogs(prev => [...prev, `> [SYSTEM] Loaded workspace: ${res.data.name}`]);
         }
      } else {
         setTerminalLogs(prev => [...prev, "> [SYSTEM] No saved projects found."]);
      }
    } catch (err) {
      console.error("Load error:", err);
      setTerminalLogs(prev => [...prev, "> [ERROR] Failed to load project."]);
    }
  };

  const handleRunCode = () => {
    if (isRunning) {
      setIsRunning(false);
      setTerminalLogs(prev => [...prev, "> Simulation Terminated.", "> System Standby."]);
      saveActivity("Stop Simulation", "User reset.");
      setEdges(eds => eds.map(e => ({ 
        ...e, 
        animated: false, 
        style: { stroke: e.data?.isError ? '#ef4444' : '#333', strokeWidth: e.data?.isError ? 3 : 2 } 
      })));
      return;
    }

    setTerminalLogs(prev => [...prev, "> Validating Hardware...", "> Flashing..."]);

    setTimeout(() => {
      setIsRunning(true);
      setTerminalLogs(prev => [
        ...prev, 
        "> SUCCESS: Controller Live. Connecting to real data stream...", 
        "> Running..."
      ]);

      saveActivity("Run Simulation", `Execution started`);

      setEdges(eds => eds.map(e => ({
        ...e, 
        animated: !e.data?.isError, 
        style: { stroke: e.data?.isError ? '#ef4444' : '#3b82f6', strokeWidth: 3 }
      })));
    }, 1500);
  };

  const onConnect = useCallback((params) => {
    // --- MODULE: Wire & Connection Validation Engine ---
    const srcPin = (params.sourceHandle || "").toLowerCase();
    const tgtPin = (params.targetHandle || "").toLowerCase();
    
    const powerPins = ['vcc', '3v3', '5v', '3.3v', 'vin'];
    const groundPins = ['gnd', 'ground'];
    
    const isSrcPower = powerPins.includes(srcPin);
    const isTgtPower = powerPins.includes(tgtPin);
    const isSrcGnd = groundPins.includes(srcPin);
    const isTgtGnd = groundPins.includes(tgtPin);
    const isSrcSignal = !isSrcPower && !isSrcGnd;
    const isTgtSignal = !isTgtPower && !isTgtGnd;

    let hasError = false;
    let errorMsg = "";

    // 1. Prevent Short Circuits (Power to Ground)
    if ((isSrcPower && isTgtGnd) || (isTgtPower && isSrcGnd)) {
       hasError = true; errorMsg = "Short Circuit! Power connected directly to Ground.";
    }
    // 2. Prevent Power/Ground to Signal
    else if ((isSrcPower && isTgtSignal) || (isTgtPower && isSrcSignal)) {
       hasError = true; errorMsg = "Invalid Wiring! Power connected to Data/Signal.";
    }
    else if ((isSrcGnd && isTgtSignal) || (isTgtGnd && isSrcSignal)) {
       hasError = true; errorMsg = "Invalid Wiring! Ground connected to Data/Signal.";
    }
    else {
      // 3. Prevent Sensor to Sensor
      const nodesList = getNodes();
      const srcNode = nodesList.find(n => n.id === params.source);
      const tgtNode = nodesList.find(n => n.id === params.target);
      if (srcNode?.type === 'sensor' && tgtNode?.type === 'sensor') {
         hasError = true; errorMsg = "Invalid Wiring! Cannot connect two sensors directly.";
      }
    }

    // 4. Prevent Multiple connections on Signal Pins
    const currentEdges = getEdges();
    const isPinOccupied = (nodeId, handleId, isSignal) => {
       if (!isSignal) return false; // Allowed for Power/GND rails
       return currentEdges.some(e => 
         (e.source === nodeId && e.sourceHandle === handleId) ||
         (e.target === nodeId && e.targetHandle === handleId)
       );
    };

    if (!hasError && isPinOccupied(params.source, params.sourceHandle, isSrcSignal)) {
       hasError = true; errorMsg = `Pin ${params.sourceHandle.toUpperCase()} is already in use.`;
    }
    if (!hasError && isPinOccupied(params.target, params.targetHandle, isTgtSignal)) {
       hasError = true; errorMsg = `Pin ${params.targetHandle.toUpperCase()} is already in use.`;
    }

    if (hasError) {
       setTerminalLogs(prev => [...prev, `> [WARNING] ${errorMsg}`]);
    }

    let strokeColor = hasError ? '#ef4444' : (isRunning ? '#3b82f6' : '#333');
    
    const newEdge = { 
       ...params, 
       data: { isError: hasError },
       style: { stroke: strokeColor, strokeWidth: hasError ? 3 : (isRunning ? 3 : 2) },
       animated: isRunning && !hasError
    };

    setEdges(eds => addEdge(newEdge, eds));
    saveActivity("Connect Wire", `Wired ${srcPin} to ${tgtPin}`);
  }, [setEdges, isRunning, getNodes, getEdges]);

  const onDrop = useCallback(e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const subType = e.dataTransfer.getData('subType');
    const imgSrc = e.dataTransfer.getData('imgSrc');
    if (!type) return;

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes(nds => [...nds, {
      id: `node_${Date.now()}`, type, position,
      data: { imgSrc, sensorType: subType, boardType: subType, active: isRunning }
    }]);
    saveActivity("Add Component", `Added ${subType || type}`);
  }, [screenToFlowPosition, setNodes, isRunning]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', flexDirection: 'column', background: '#0a0a0a' }}>
      {/* TOOLBAR */}
      <div style={{ height: 44, borderBottom: '1px solid #222', background: '#111', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'Syne', color: '#3b82f6' }}>MR_ENGINEER_SIM v2.0</div>
        <div style={{ flex: 1 }} />
        <button 
          onClick={handleSaveProject} 
          style={{ height: 32, padding: '0 15px', borderRadius: '4px', border: '1px solid #3b82f640', background: '#1a1a24', color: '#3b82f6', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
        >
          SAVE PROJECT
        </button>
        <button 
          onClick={handleLoadProject} 
          style={{ height: 32, padding: '0 15px', borderRadius: '4px', border: '1px solid #333', background: '#222', color: '#ccc', fontSize: '0.7rem', cursor: 'pointer' }}
        >
          LOAD LATEST
        </button>
        <button 
          onClick={handleRunCode} 
          style={{ 
            height: 32, padding: '0 15px', borderRadius: '4px', border: 'none', cursor: 'pointer',
            background: isRunning ? '#e11d48' : '#3b82f6', color: '#fff', fontWeight: 600, fontSize: '0.7rem'
          }}
        >
          {isRunning ? 'RESET SYSTEM' : 'UPLOAD & RUN'}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* PALETTE */}
        <div style={{ width: 220, borderRight: '1px solid #222', background: '#111', padding: 12, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6rem', color: '#555', marginBottom: 10, letterSpacing: '1px' }}>CORE CONTROLLERS</div>
          <PaletteItem category="mcu" type="esp32" />
          <PaletteItem category="mcu" type="pico" />
          <PaletteItem category="mcu" type="raspberrypi" />
          
          <div style={{ fontSize: '0.6rem', color: '#555', marginTop: 20, marginBottom: 10, letterSpacing: '1px' }}>SENSORS & MODULES</div>
          {Object.keys(CATALOG).map(k => <PaletteItem key={k} category="sensor" type={k} />)}
        </div>

        {/* CANVAS */}
        <div style={{ flex: 1, position: 'relative' }}>

          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onDrop={onDrop} onDragOver={e => e.preventDefault()}
            nodeTypes={nodeTypes} fitView
          >
            <Background color="#222" variant={BackgroundVariant.Dots} />
            <Controls />
          </ReactFlow>
        </div>

        {/* EDITOR & TERMINAL */}
        <div style={{ width: 400, background: '#050505', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #222' }}>
          <div style={{ flex: 1 }}>
            <Editor
              height="100%" theme="vs-dark" defaultLanguage="python"
              value={code} onChange={(v) => setCode(v)}
              options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 10 } }}
            />
          </div>
          <div ref={terminalRef} style={{ height: 180, background: '#000', padding: '12px', overflowY: 'auto', borderTop: '2px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ color: '#3b82f6', fontSize: '0.6rem', fontWeight: 700 }}>SERIAL MONITOR</div>
              <button 
                onClick={() => setTerminalLogs(["> System Ready. Logs cleared."])}
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', fontSize: '0.6rem', cursor: 'pointer', padding: '3px 8px', borderRadius: '4px', zIndex: 10 }}
              >
                CLEAR
              </button>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#aaa' }}>
              {terminalLogs.map((log, i) => (
                <div key={i} style={{ color: log.includes('SUCCESS') ? '#10b981' : (log.includes('[MONITOR]') ? '#3b82f6' : '#666'), marginBottom: 3 }}>
                  {log}
                </div>
              ))}
              {isRunning && <span className="blink" style={{ color: '#3b82f6' }}>_</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  return <ReactFlowProvider><SimulatorCanvas /></ReactFlowProvider>;
}