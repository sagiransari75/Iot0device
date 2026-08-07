'use client';
import { Handle, Position, useEdges } from '@xyflow/react';
import { useState, useEffect, useRef } from 'react';

export const CATALOG = {
  // Sensors
  dht11:   { label: 'DHT11',        sub: 'Temp / Hum',       color: '#ff5500', dataKey: 'temperature', unit: '°C',   icon: '🌡️' },
  pir:     { label: 'PIR HC-SR501', sub: 'Motion Sensor',    color: '#00ff88', dataKey: 'motion',       unit: '',     icon: '👁️' },
  ldr:     { label: 'LDR Module',   sub: 'Light Sensor',     color: '#0099ff', dataKey: 'light',        unit: ' lux', icon: '💡' },
  hcsr04:  { label: 'HC-SR04',      sub: 'Ultrasonic Dist.', color: '#aa44ff', dataKey: 'distance',     unit: ' cm',  icon: '📡' },
  mq2:     { label: 'MQ-2',         sub: 'Gas / Smoke',      color: '#ff4444', dataKey: 'gas',          unit: ' ppm', icon: '💨' },
  mq3:     { label: 'MQ-3',         sub: 'Alcohol Gas',      color: '#ffa500', dataKey: 'alcohol',      unit: ' ppm', icon: '🍷' },
  mq4:     { label: 'MQ-4',         sub: 'Methane Gas',      color: '#ff6644', dataKey: 'methane',      unit: ' ppm', icon: '💨' },
  dht22:   { label: 'DHT22',        sub: 'Hi-res Temp/Hum',  color: '#00e1ff', dataKey: 'humidity',     unit: '%',    icon: '💧' },
  bme280:  { label: 'BME280',       sub: 'Pressure I2C',     color: '#ffaa00', dataKey: 'pressure',     unit: ' hPa', icon: '🌬️' },
  ky037:   { label: 'KY-037',       sub: 'Sound Sensor',     color: '#44ffaa', dataKey: 'sound',        unit: '',     icon: '🔊' },
  moisture:{ label: 'Moisture',     sub: 'Soil Moisture',    color: '#00aaff', dataKey: 'moisture',     unit: '%',    icon: '💧' },
  // Actuators
  led:     { label: 'LED',          sub: 'Output Indicator', color: '#ffdd00', dataKey: 'led',          unit: '',     icon: '💡' },
  buzzer:  { label: 'Buzzer',       sub: 'Audio Alert',      color: '#ff8844', dataKey: 'buzzer',       unit: '',     icon: '🔔' },
  button:  { label: 'Push Button',  sub: 'Digital Input',    color: '#44ffdd', dataKey: 'button',       unit: '',     icon: '🔘' },
};

// --- LED Visual Component (Image based with premium glow) ---
function LedVisual({ active, error, color = '#ffdd00' }) {
  const glowColor = error ? '#ef4444' : color;
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', padding: '12px' }}>
      <img
        src="/devices/led.png"
        alt="LED"
        onError={e => { e.target.src = '/devices/sensor_generic.png'; }}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain', 
          pointerEvents: 'none',
          filter: active ? `brightness(1.5) drop-shadow(0 0 15px ${glowColor})` : 'grayscale(0.4) brightness(0.8)',
          transition: 'all 0.3s ease'
        }}
      />
      
      {active && !error && (
        <div style={{
          position: 'absolute', 
          top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40px', height: '40px',
          background: glowColor,
          borderRadius: '50%',
          filter: 'blur(20px)',
          opacity: 0.8,
          zIndex: -1,
          animation: 'ledPulse 1.2s ease-in-out infinite alternate'
        }} />
      )}

      {error && (
        <div style={{
          position: 'absolute', inset: 0, border: '2px dashed #ef4444',
          borderRadius: 12, animation: 'sensorPulse 1s infinite'
        }} />
      )}
    </div>
  );
}

// --- Buzzer Visual Component ---
function BuzzerVisual({ active, error }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src="/devices/buzzer.png"
        alt="Buzzer"
        onError={e => { e.target.src = '/devices/sensor_generic.png'; }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, pointerEvents: 'none' }}
      />
      {active && !error && (
        <>
          {/* Sound waves animation */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 30 + i * 20,
              height: 30 + i * 20,
              borderRadius: '50%',
              border: `2px solid #ff884488`,
              opacity: 0,
              animation: `soundWave 1.2s ease-out ${i * 0.3}s infinite`,
              pointerEvents: 'none'
            }} />
          ))}
          <div style={{
            position: 'absolute', inset: -4, borderRadius: 12,
            boxShadow: '0 0 20px 8px #ff884466',
            pointerEvents: 'none'
          }} />
        </>
      )}
    </div>
  );
}

// --- Button Visual ---
function ButtonVisual({ pressed }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src="/devices/button.png"
        alt="Button"
        onError={e => { e.target.src = '/devices/sensor_generic.png'; }}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8,
          pointerEvents: 'none',
          filter: pressed ? 'brightness(1.5) drop-shadow(0 0 8px #44ffdd)' : 'none',
          transition: 'filter 0.1s'
        }}
      />
      {pressed && (
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 10,
          boxShadow: '0 0 12px 4px #44ffdd66', pointerEvents: 'none'
        }} />
      )}
    </div>
  );
}

// --- Generic Sensor Visual ---
function SensorVisual({ sensorType, liveValue, isActive, color, unit, cat }) {
  const getSensorImg = (type) => `${type}.png`;

  const getBrightness = () => {
    if (!isActive || liveValue === null || liveValue === undefined) return 'none';
    return `brightness(1.15) drop-shadow(0 0 8px ${color}88)`;
  };
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src={`/devices/${getSensorImg(sensorType)}`}
        alt={cat.label}
        onError={e => { e.target.src = '/devices/sensor_generic.png'; }}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, pointerEvents: 'none',
          filter: getBrightness(), transition: 'filter 0.4s ease'
        }}
      />
      {/* Activity pulse ring */}
      {isActive && liveValue !== null && liveValue !== undefined && (
        <div style={{
          position: 'absolute', inset: -3, borderRadius: 11,
          boxShadow: `0 0 12px 4px ${color}55`, pointerEvents: 'none',
          animation: 'sensorPulse 2s ease-in-out infinite'
        }} />
      )}
    </div>
  );
}

// ─── Main SensorNode ──────────────────────────────────────────────────────────
export function SensorNode({ id, data, selected }) {
  const edges = useEdges();
  const cat = CATALOG[data.sensorType] || CATALOG.dht11;
  const { color, label, sub, unit } = cat;
  const [hoveredHandle, setHoveredHandle] = useState(null);

  const live      = data.liveValue;
  const hasLive   = live !== undefined && live !== null;
  const isRunning = data.isRunning || false;

  // Determine pin requirements
  let requiredHandles = ['vcc', 'gnd', 'signal'];
  if (data.sensorType === 'hcsr04')  requiredHandles = ['vcc', 'gnd', 'trig', 'echo'];
  else if (data.sensorType === 'bme280') requiredHandles = ['vcc', 'gnd', 'sda', 'scl'];
  else if (data.sensorType === 'led')    requiredHandles = ['gnd', 'signal']; // 2 wires for LED
  else if (['buzzer'].includes(data.sensorType)) requiredHandles = ['vcc', 'gnd', 'signal'];

  const connectedEdges   = edges.filter(e => e.source === id || e.target === id);
  const connectedHandles = connectedEdges.map(e => e.source === id ? e.sourceHandle : e.targetHandle);
  const isFullyWired     = requiredHandles.every(h => connectedHandles.includes(h));
  const hasWireError     = connectedEdges.some(e => e.data?.isError);
  const isWired          = connectedEdges.length > 0;

  // Is this component actively simulating?
  const isActive = isRunning && isFullyWired && !hasWireError;

  // ── Display value for sensors ──
  let display = '— —';
  if (isActive && hasLive) {
    if (data.sensorType === 'led' || data.sensorType === 'buzzer') {
      display = live ? 'ON' : 'OFF';
    } else if (typeof live === 'boolean' || data.sensorType === 'ky037' || data.sensorType === 'pir') {
      display = live ? 'DETECTED' : 'CLEAR';
    } else {
      display = `${live}${unit}`;
    }
  }
  if (!isRunning && isWired)   display = 'STANDBY';
  if (!isFullyWired && isWired) display = 'NOT WIRED';
  if (hasWireError)             display = 'WIRE ERR';

  // ── Status color for label ──
  const statusColor = hasWireError ? '#ef4444' : (isActive ? color : '#555');

  // ─── Render device body ────────────────────────────────────────────────────
  const renderDevice = () => {
    // For actuators, we only want them visually active if simulation is running AND they receive a HIGH signal
    const isActuatorActive = isActive && live === true;

    switch (data.sensorType) {
      case 'led':
        return <LedVisual active={isActuatorActive} error={hasWireError} color={color} />;
      case 'buzzer':
        return <BuzzerVisual active={isActuatorActive} error={hasWireError} />;
      case 'button':
        return <ButtonVisual pressed={isActive} />;
      default:
        return (
          <SensorVisual
            sensorType={data.sensorType}
            liveValue={live}
            isActive={isActive}
            color={color}
            unit={unit}
            cat={cat}
          />
        );
    }
  };

  // ── Pin helper ──
  const renderHandle = (handleId, labelText, handleColor) => (
    <div style={{ position: 'relative', width: 8, height: 8 }} key={handleId}>
      <div
        onMouseEnter={() => setHoveredHandle(handleId)}
        onMouseLeave={() => setHoveredHandle(null)}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <Handle
          type="target"
          position={Position.Bottom}
          id={handleId}
          style={{
            background: connectedHandles.includes(handleId) ? handleColor : '#1a1a1a',
            border: `1.5px solid ${handleColor}`,
            width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        />
        {hoveredHandle === handleId && (
          <div style={{
            position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.95)', color: handleColor, padding: '3px 8px',
            borderRadius: 4, fontSize: '0.65rem', fontWeight: 'bold', whiteSpace: 'nowrap',
            border: `1px solid ${handleColor}`, zIndex: 100, pointerEvents: 'none'
          }}>
            {labelText}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* CSS Keyframes injected once */}
      <style>{`
        @keyframes ledPulse {
          from { opacity: 0.7; }
          to   { opacity: 1.0; }
        }
        @keyframes soundWave {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(2.0); opacity: 0; }
        }
        @keyframes sensorPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
      `}</style>

      <div style={{
        width: 140, height: 140, position: 'relative',
        filter: selected ? `drop-shadow(0 0 12px ${color}80)` : 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
        transition: 'all 0.3s ease-in-out', userSelect: 'none', borderRadius: 8,
      }}>
        {/* Status Badge on top */}
        <div style={{
          position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.88)', color: statusColor, padding: '3px 10px',
          borderRadius: 6, fontSize: '0.72rem', fontWeight: 'bold', fontFamily: 'monospace',
          border: `1px solid ${statusColor}55`, whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: isActive ? `0 0 8px ${color}44` : 'none',
          pointerEvents: 'none', transition: 'all 0.3s'
        }}>
          {(isActive && hasLive) || (!isRunning && isWired) || hasWireError || (!isFullyWired && isWired)
            ? display
            : label}
        </div>

        {/* Device body */}
        {renderDevice()}

        {/* Running indicator dot */}
        {isRunning && (
          <div style={{
            position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%',
            background: isActive ? '#10b981' : '#ef4444',
            boxShadow: isActive ? '0 0 6px #10b981' : '0 0 6px #ef4444',
            animation: 'sensorPulse 1.5s ease-in-out infinite',
            zIndex: 20
          }} />
        )}

        {/* Sub-label at bottom inside device */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center',
          background: 'rgba(0,0,0,0.6)', color: color, fontSize: '0.55rem',
          fontWeight: 700, letterSpacing: '0.5px', padding: '2px 0', borderRadius: '0 0 8px 8px',
          fontFamily: 'monospace'
        }}>
          {sub}
        </div>

        {/* Pin Header Row */}
        <div style={{
          position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 10, background: 'var(--sim-bg)', padding: '4px 8px',
          borderRadius: 4, border: '1px solid var(--sim-border3)'
        }}>
          {renderHandle('gnd', 'GND', '#555566')}
          {data.sensorType !== 'led' && renderHandle('vcc', 'VCC', '#cc2222')}

          {data.sensorType === 'hcsr04' ? (
            <>
              {renderHandle('trig', 'TRIG', color)}
              {renderHandle('echo', 'ECHO', color)}
             </>
          ) : data.sensorType === 'bme280' ? (
            <>
              {renderHandle('sda', 'SDA', color)}
              {renderHandle('scl', 'SCL', color)}
            </>
          ) : (
            renderHandle('signal', 'SIG', color)
          )}
        </div>
      </div>
    </>
  );
}