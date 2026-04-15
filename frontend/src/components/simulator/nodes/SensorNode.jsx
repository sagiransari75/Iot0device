import { Handle, Position, useEdges } from '@xyflow/react';
import { useState } from 'react';

export const CATALOG = {
  // Original
  dht11:      { label: 'DHT11',         sub: 'Temp / Hum',         color: '#ff5500', dataKey: 'temperature', unit: '°C' },
  pir:        { label: 'PIR HC-SR501',  sub: 'Motion Sensor',      color: '#00ff88', dataKey: 'motion',       unit: '' },
  ldr:        { label: 'LDR Module',    sub: 'Light Sensor',       color: '#0099ff', dataKey: 'light',        unit: ' lux' },
  // Actuators
  led:        { label: 'LED',           sub: 'Output Indicator',   color: '#ffdd00', dataKey: null,           unit: '' },
  buzzer:     { label: 'Buzzer',        sub: 'Audio Alert',        color: '#ff8844', dataKey: null,           unit: '' },
  button:     { label: 'Push Button',   sub: 'Digital Input',      color: '#44ffdd', dataKey: null,           unit: '' },
  // New Sensors
  hcsr04:     { label: 'HC-SR04',       sub: 'Ultrasonic Dist.',   color: '#aa44ff', dataKey: 'distance',     unit: ' cm' },
  mq2:        { label: 'MQ-2',          sub: 'Gas / Smoke',        color: '#ff4444', dataKey: 'gas',          unit: ' ppm' },
  dht22:      { label: 'DHT22',         sub: 'Hi-res Temp/Hum',    color: '#00e1ff', dataKey: 'humidity',     unit: '%' },
  bme280:     { label: 'BME280',        sub: 'Pressure I2C',       color: '#ffaa00', dataKey: 'pressure',     unit: ' hPa' },
  ky037:      { label: 'KY-037',        sub: 'Sound Sensor',       color: '#44ffaa', dataKey: 'sound',        unit: '' },
};

export function SensorNode({ id, data, selected }) {
  const edges = useEdges();
  const cat   = CATALOG[data.sensorType] || CATALOG.dht11;
  const { color, label, sub, unit } = cat;
  const [hoveredHandle, setHoveredHandle] = useState(null);

  const live      = data.liveValue;
  const hasLive   = live !== undefined && live !== null;

  let requiredHandles = ['vcc', 'gnd', 'signal'];
  if (data.sensorType === 'hcsr04') requiredHandles = ['vcc', 'gnd', 'trig', 'echo'];
  else if (data.sensorType === 'bme280') requiredHandles = ['vcc', 'gnd', 'sda', 'scl'];
  
  const connectedEdges = edges.filter(e => e.source === id || e.target === id);
  const connectedHandles = connectedEdges.map(e => e.source === id ? e.sourceHandle : e.targetHandle);
  const isFullyWired = requiredHandles.every(h => connectedHandles.includes(h));
  const hasWireError = connectedEdges.some(e => e.data?.isError);
  const isWired = connectedEdges.length > 0;

  let display = '— —';
  if (isFullyWired && !hasWireError && hasLive) {
    if (typeof live === 'boolean' || data.sensorType === 'ky037' || data.sensorType === 'pir') {
      display = live ? 'DETECTED' : 'CLEAR';
    } else {
      display = `${live}${unit}`;
    }
  }

  // --- IMAGE LOGIC FIX ---
  // Ab ye automatic aapke public/devices/ folder se sensorType ke naam ki image uthayega
  const imgSrc = `/devices/${data.sensorType || 'sensor_generic'}.png`;

  // LED Specific logic dynamically reacts to connection status
  let dynamicGlow = '';
  if (data.sensorType === 'led' && isWired) {
     if (hasWireError) {
        dynamicGlow = 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 45px rgba(239, 68, 68, 0.6))';
     } else {
        dynamicGlow = 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.95)) drop-shadow(0 0 45px rgba(16, 185, 129, 0.6))';
     }
  }

  return (
    <div style={{
      width: 140, height: 140, position: 'relative',
      filter: dynamicGlow || (selected ? `drop-shadow(0 0 12px ${color}80)` : 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))'),
      transition: 'all 0.3s ease-in-out', userSelect: 'none', borderRadius: 8
    }}>
      {/* Real-time Data Display on Top of Device */}
      {isFullyWired && !hasWireError && hasLive && (
        <div style={{
          position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.85)', color: color, padding: '4px 10px',
          borderRadius: 6, fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace',
          border: `1px solid ${color}80`, whiteSpace: 'nowrap', zIndex: 10,
          boxShadow: `0 0 10px ${color}40`, pointerEvents: 'none' // Click-through
        }}>
          {display}
        </div>
      )}

      {/* The Core Device Image - RESTORED ORIGINAL STYLE */}
      <img 
        src={imgSrc} 
        alt={label} 
        onError={(e) => { e.target.src = '/devices/sensor_generic.png'; }} // Fallback if image missing
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, pointerEvents: 'none' }} 
      />

      {/* Pin Headers - RESTORED ORIGINAL STYLE */}
      <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 12, background: '#111', padding: '4px 8px', borderRadius: 4, border: '1px solid #333' }}>
        {/* GND Pin */}
        <div style={{ position: 'relative', width: 8, height: 8 }}>
          <div
            onMouseEnter={() => setHoveredHandle('gnd')}
            onMouseLeave={() => setHoveredHandle(null)}
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            <Handle type="target" position={Position.Bottom} id="gnd" style={{ background: '#333344', border: '1px solid #555566', width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer' }} />
            {hoveredHandle === 'gnd' && (
              <div style={{
                position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.95)', color: '#fff', padding: '4px 8px',
                borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                border: '1px solid #555', zIndex: 100, pointerEvents: 'none'
              }}>
                GND
              </div>
            )}
          </div>
        </div>

        {/* VCC Pin */}
        <div style={{ position: 'relative', width: 8, height: 8 }}>
          <div
            onMouseEnter={() => setHoveredHandle('vcc')}
            onMouseLeave={() => setHoveredHandle(null)}
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            <Handle type="target" position={Position.Bottom} id="vcc" style={{ background: '#cc2222', border: '1px solid #ff3333', width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer' }} />
            {hoveredHandle === 'vcc' && (
              <div style={{
                position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.95)', color: '#ff3333', padding: '4px 8px',
                borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                border: '1px solid #ff3333', zIndex: 100, pointerEvents: 'none'
              }}>
                VCC
              </div>
            )}
          </div>
        </div>
        
        {data.sensorType === 'hcsr04' ? (
          <>
            {/* TRIG Pin */}
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <div
                onMouseEnter={() => setHoveredHandle('trig')}
                onMouseLeave={() => setHoveredHandle(null)}
                style={{ position: 'relative', width: '100%', height: '100%' }}
              >
                <Handle type="target" position={Position.Bottom} id="trig" style={{ background: color, border: `1px solid ${color}`, width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer' }} />
                {hoveredHandle === 'trig' && (
                  <div style={{
                    position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.95)', color: color, padding: '4px 8px',
                    borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                    border: `1px solid ${color}`, zIndex: 100, pointerEvents: 'none'
                  }}>
                    TRIG
                  </div>
                )}
              </div>
            </div>

            {/* ECHO Pin */}
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <div
                onMouseEnter={() => setHoveredHandle('echo')}
                onMouseLeave={() => setHoveredHandle(null)}
                style={{ position: 'relative', width: '100%', height: '100%' }}
              >
                <Handle type="target" position={Position.Bottom} id="echo" style={{ background: color, border: `1px solid ${color}`, width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer' }} />
                {hoveredHandle === 'echo' && (
                  <div style={{
                    position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.95)', color: color, padding: '4px 8px',
                    borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                    border: `1px solid ${color}`, zIndex: 100, pointerEvents: 'none'
                  }}>
                    ECHO
                  </div>
                )}
              </div>
            </div>
          </>
        ) : data.sensorType === 'bme280' ? (
          <>
            {/* SDA Pin */}
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <div
                onMouseEnter={() => setHoveredHandle('sda')}
                onMouseLeave={() => setHoveredHandle(null)}
                style={{ position: 'relative', width: '100%', height: '100%' }}
              >
                <Handle type="target" position={Position.Bottom} id="sda" style={{ background: color, border: `1px solid ${color}`, width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer' }} />
                {hoveredHandle === 'sda' && (
                  <div style={{
                    position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.95)', color: color, padding: '4px 8px',
                    borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                    border: `1px solid ${color}`, zIndex: 100, pointerEvents: 'none'
                  }}>
                    SDA
                  </div>
                )}
              </div>
            </div>

            {/* SCL Pin */}
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <div
                onMouseEnter={() => setHoveredHandle('scl')}
                onMouseLeave={() => setHoveredHandle(null)}
                style={{ position: 'relative', width: '100%', height: '100%' }}
              >
                <Handle type="target" position={Position.Bottom} id="scl" style={{ background: color, border: `1px solid ${color}`, width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer' }} />
                {hoveredHandle === 'scl' && (
                  <div style={{
                    position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.95)', color: color, padding: '4px 8px',
                    borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                    border: `1px solid ${color}`, zIndex: 100, pointerEvents: 'none'
                  }}>
                    SCL
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* SIGNAL Pin */
          <div style={{ position: 'relative', width: 8, height: 8 }}>
            <div
              onMouseEnter={() => setHoveredHandle('signal')}
              onMouseLeave={() => setHoveredHandle(null)}
              style={{ position: 'relative', width: '100%', height: '100%' }}
            >
              <Handle type="target" position={Position.Bottom} id="signal" style={{ background: color, border: `1px solid ${color}`, width: 10, height: 10, right: -1, bottom: -1, cursor: 'pointer' }} />
              {hoveredHandle === 'signal' && (
                <div style={{
                  position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.95)', color: color, padding: '4px 8px',
                  borderRadius: 4, fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                  border: `1px solid ${color}`, zIndex: 100, pointerEvents: 'none'
                }}>
                  SIGNAL
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}