import { Handle, Position } from '@xyflow/react';

// Left column is ODD pins, right column is EVEN pins
// Standard 40-pin Raspberry Pi GPIO header mapping
const HEADER_PINS = [
  // Row 1
  { p: 1,  name: '3V3',   c: '#ff3333' },  { p: 2,  name: '5V',    c: '#cc2222' },
  { p: 3,  name: 'SDA',   c: '#00ccff', bcm: 2 },  { p: 4,  name: '5V',    c: '#cc2222' },
  { p: 5,  name: 'SCL',   c: '#00ccff', bcm: 3 },  { p: 6,  name: 'GND',   c: '#555566' },
  { p: 7,  name: 'GP4',   c: '#cc00ff', bcm: 4 },  { p: 8,  name: 'TXD',   c: '#eeeeaa', bcm: 14 },
  { p: 9,  name: 'GND',   c: '#555566' },  { p: 10, name: 'RXD',   c: '#eeeeaa', bcm: 15 },
  { p: 11, name: 'GP17',  c: '#ff5500', bcm: 17 }, { p: 12, name: 'GP18',  c: '#00ff88', bcm: 18 },
  { p: 13, name: 'GP27',  c: '#aaaaaa', bcm: 27 }, { p: 14, name: 'GND',   c: '#555566' },
  { p: 15, name: 'GP22',  c: '#ff00aa', bcm: 22 }, { p: 16, name: 'GP23',  c: '#ffff00', bcm: 23 },
  { p: 17, name: '3V3',   c: '#ff3333' },  { p: 18, name: 'GP24',  c: '#0099ff', bcm: 24 },
  { p: 19, name: 'MOSI',  c: '#00ccff', bcm: 10 }, { p: 20, name: 'GND',   c: '#555566' },
  { p: 21, name: 'MISO',  c: '#00ccff', bcm: 9 },  { p: 22, name: 'GP25',  c: '#ffaa00', bcm: 25 },
  { p: 23, name: 'SCLK',  c: '#00ccff', bcm: 11 }, { p: 24, name: 'CE0',   c: '#00ccff', bcm: 8 },
  { p: 25, name: 'GND',   c: '#555566' },  { p: 26, name: 'CE1',   c: '#00ccff', bcm: 7 },
  { p: 27, name: 'ID_SD', c: '#ffffff', bcm: 0 },  { p: 28, name: 'ID_SC', c: '#ffffff', bcm: 1 },
  { p: 29, name: 'GP5',   c: '#cfcfcf', bcm: 5 },  { p: 30, name: 'GND',   c: '#555566' },
  { p: 31, name: 'GP6',   c: '#cfcfcf', bcm: 6 },  { p: 32, name: 'GP12',  c: '#cfcfcf', bcm: 12 },
  { p: 33, name: 'GP13',  c: '#cfcfcf', bcm: 13 }, { p: 34, name: 'GND',   c: '#555566' },
  { p: 35, name: 'GP19',  c: '#00ccff', bcm: 19 }, { p: 36, name: 'GP16',  c: '#cfcfcf', bcm: 16 },
  { p: 37, name: 'GP26',  c: '#cfcfcf', bcm: 26 }, { p: 38, name: 'GP20',  c: '#00ccff', bcm: 20 },
  { p: 39, name: 'GND',   c: '#555566' },  { p: 40, name: 'GP21',  c: '#00ccff', bcm: 21 },
];

export function RaspberryPiNode({ data, selected }) {
  const states = data.gpioStates || {};

  return (
    <div style={{
      width: 280, height: 200, position: 'relative',
      filter: selected ? 'drop-shadow(0 0 12px rgba(255,100,0,0.8))' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
      transition: 'all 0.2s', userSelect: 'none', borderRadius: 8
    }}>
      <img src="/devices/raspberrypi.png" alt="RPI Full" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, pointerEvents: 'none' }} draggable={false} />

      {/* 2x20 Pin Header horizontally aligned on the top edge per actual image */}
      <div style={{ 
        position: 'absolute', right: '6%', top: 18, width: '75%', height: 24,
        display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gridAutoFlow: 'column', gap: 1
      }}>
        {HEADER_PINS.map((pin, i) => {
          const isBCM = pin.bcm !== undefined;
          const pinId = isBCM ? `gpio${pin.bcm}` : (pin.name === 'GND' ? 'gnd' : pin.name.toLowerCase());
          const high = isBCM && states[pinId] === 'HIGH';

          return (
            <div key={pin.p} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={`${pin.p}: ${pin.name}`}>
              <Handle type="source" position={Position.Top} id={pinId} 
                style={{ 
                  position: 'static', background: high ? pin.c : 'rgba(0,0,0,0.5)', 
                  border: `1px solid ${high ? pin.c : 'rgba(255,255,255,0.3)'}`, 
                  width: 8, height: 8, borderRadius: '50%', transform: 'none' 
                }} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
