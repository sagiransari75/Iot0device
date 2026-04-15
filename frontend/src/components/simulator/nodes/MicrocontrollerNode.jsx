import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';

const BOARDS = {
  esp32: {
    label: 'ESP32 WROOM-32', 
    hl: '#ffaa00',
    width: 240, height: 160,
    gridLeft: '11.5%', gridTop: '16%', gridWidth: '77%', gridHeight: '68%',
    pinsTop:    ['3V3', 'EN', 'VP', 'VN', '34', '35', '32', '33', '25', '26', '27', '14', '12', '13', 'GND', 'VIN'],
    pinsBottom: ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND', '3V3', 'CMD'],
  },
  pico: {
    label: 'Raspberry Pi Pico', 
    hl: '#00ff88',
    width: 420, height: 250, 
    gridLeft: '7.8%', gridTop: '13.5%', gridWidth: '84.4%', gridHeight: '73%',
    pinsTop:    ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7', 'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'],
    pinsBottom: ['VBUS', 'VSYS', 'GND', '3V3', '3V3_EN', 'ADC_V', 'GP28', 'GND', 'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'],
  }
};

export const MicrocontrollerNode = memo(({ data, selected }) => {
  // --- SABSE ZAROORI FIX: Fallback logic ---
  const type = data?.boardType || 'esp32';
  const board = BOARDS[type] || BOARDS.esp32; // Agar pico na mile toh esp32 load ho jaye crash hone ki jagah
  const states = data?.gpioStates || {};

  return (
    <div style={{
      width: board.width, 
      height: board.height, 
      position: 'relative',
      filter: selected ? `drop-shadow(0 0 15px ${board.hl}aa)` : 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
      transition: 'all 0.2s',
      borderRadius: '8px',
      overflow: 'hidden', 
      background: '#111'
    }}>
      <img 
        src={`/devices/${type}.png`} 
        alt={board.label} 
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} 
        draggable={false} 
        onError={(e) => { e.target.src = '/devices/pico.png'; }} // Fallback image check
      />

      <div style={{ 
        position: 'absolute', left: board.gridLeft, top: board.gridTop, width: board.gridWidth, height: board.gridHeight,
        display: 'grid', gridTemplateColumns: `repeat(${board.pinsTop.length}, 1fr)`, gridTemplateRows: '1fr 1fr', pointerEvents: 'none', zIndex: 50
      }}>
        {board.pinsTop.map((pin, i) => (
          <div key={`T${i}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <Handle type="source" position={Position.Top} id={pin.toLowerCase()} 
              style={{ position: 'static', background: states[pin.toLowerCase()] === 'HIGH' ? board.hl : '#000', border: `1.2px solid #ffd700`, width: 7, height: 7, borderRadius: '50%', pointerEvents: 'all' }} 
            />
          </div>
        ))}
        {board.pinsBottom.map((pin, i) => (
          <div key={`B${i}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
            <Handle type="source" position={Position.Bottom} id={pin.toLowerCase()} 
              style={{ position: 'static', background: states[pin.toLowerCase()] === 'HIGH' ? board.hl : '#000', border: `1.2px solid #ffd700`, width: 7, height: 7, borderRadius: '50%', pointerEvents: 'all' }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
});