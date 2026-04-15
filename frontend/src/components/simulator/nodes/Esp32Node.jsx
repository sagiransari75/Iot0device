import { Handle, Position } from '@xyflow/react';

export function ESP32Node({ selected }) {
  const pinStyle = {
    width: 10,
    height: 10,
    background: '#333',
    border: '1px solid #555',
    borderRadius: '2px',
    cursor: 'crosshair',
    position: 'absolute'
  };

  const leftPins = ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
  const rightPins = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'D17', 'D16', 'D4', 'D2', 'D15', 'SD1', '3V3'];

  return (
    <div style={{
      width: 150,
      height: 260,
      background: '#111', 
      borderRadius: '8px',
      border: selected ? '2px solid #3b82f6' : '1px solid #333',
      filter: selected ? 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))' : 'none',
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Background Image of ESP32 */}
      <img 
        src="/devices/esp32.png" 
        alt="ESP32" 
        style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          objectFit: 'contain', pointerEvents: 'none', opacity: 0.9 
        }} 
      />

      {/* LEFT PINS (zIndex high taaki image ke upar rahein) */}
      <div style={{ position: 'absolute', left: -5, top: 45, bottom: 15, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 20 }}>
        {leftPins.map((pin) => (
          <div key={`left-${pin}`} style={{ position: 'relative', height: '12px' }}>
            <Handle type="source" position={Position.Left} id={pin} style={{ ...pinStyle, left: 0 }} />
            <span style={{ position: 'absolute', left: 12, fontSize: '7px', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>{pin}</span>
          </div>
        ))}
      </div>

      {/* RIGHT PINS */}
      <div style={{ position: 'absolute', right: 5, top: 45, bottom: 15, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 20 }}>
        {rightPins.map((pin) => (
          <div key={`right-${pin}`} style={{ position: 'relative', height: '12px', textAlign: 'right' }}>
            <Handle type="source" position={Position.Right} id={pin} style={{ ...pinStyle, right: 0 }} />
            <span style={{ position: 'absolute', right: 12, fontSize: '7px', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>{pin}</span>
          </div>
        ))}
      </div>
    </div>
  );
}