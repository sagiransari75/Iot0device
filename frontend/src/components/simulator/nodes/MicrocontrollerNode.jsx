import { Handle, Position } from '@xyflow/react';
import { memo, useState } from 'react';

// ─── Board Definitions ────────────────────────────────────────────────────────
// Each board has:
//   img         - image path
//   w/h         - canvas size in px
//   color       - accent color
//   leftPins    - array of { id, label, color } — shown on LEFT side
//   rightPins   - array of { id, label, color } — shown on RIGHT side
//   topPins     - array of { id, label, color } — shown on TOP  (optional)
//   bottomPins  - array of { id, label, color } — shown on BOTTOM (optional)

const PM = {                          // pin-color presets
  pwr:    '#ef4444',  // red  — 5V / VIN / 3V3
  gnd:    '#6b7280',  // gray — GND
  dig:    '#3b82f6',  // blue — digital GPIO
  ana:    '#a855f7',  // violet — analog
  uart:   '#f59e0b',  // amber — UART
  i2c:    '#10b981',  // teal  — I2C
  spi:    '#06b6d4',  // cyan  — SPI
  pwm:    '#f97316',  // orange — PWM
  adc:    '#8b5cf6',  // purple — ADC
};

const BOARDS = {

  // ── ESP32 WROOM-32 ──────────────────────────────────────────────────────────
  esp32: {
    img: '/devices/esp32.png',
    w: 180, h: 300,
    color: '#f59e0b',
    leftPins: [
      { id: '3v3',  label: '3V3',  c: PM.pwr  },
      { id: 'en',   label: 'EN',   c: PM.dig  },
      { id: 'd36',  label: 'D36',  c: PM.adc  },
      { id: 'd39',  label: 'D39',  c: PM.adc  },
      { id: 'd34',  label: 'D34',  c: PM.adc  },
      { id: 'd35',  label: 'D35',  c: PM.adc  },
      { id: 'd32',  label: 'D32',  c: PM.dig  },
      { id: 'd33',  label: 'D33',  c: PM.dig  },
      { id: 'd25',  label: 'D25',  c: PM.dig  },
      { id: 'd26',  label: 'D26',  c: PM.dig  },
      { id: 'd27',  label: 'D27',  c: PM.dig  },
      { id: 'd14',  label: 'D14',  c: PM.dig  },
      { id: 'd12',  label: 'D12',  c: PM.spi  },
      { id: 'gnd1', label: 'GND',  c: PM.gnd  },
      { id: 'd13',  label: 'D13',  c: PM.spi  },
      { id: 'd9',   label: 'SD2',  c: PM.spi  },
      { id: 'vin',  label: 'VIN',  c: PM.pwr  },
    ],
    rightPins: [
      { id: 'gnd2', label: 'GND',  c: PM.gnd  },
      { id: 'd23',  label: 'D23',  c: PM.spi  },
      { id: 'd22',  label: 'D22',  c: PM.i2c  },
      { id: 'tx0',  label: 'TX0',  c: PM.uart },
      { id: 'rx0',  label: 'RX0',  c: PM.uart },
      { id: 'd21',  label: 'D21',  c: PM.i2c  },
      { id: 'd19',  label: 'D19',  c: PM.spi  },
      { id: 'd18',  label: 'D18',  c: PM.spi  },
      { id: 'd5',   label: 'D5',   c: PM.dig  },
      { id: 'tx2',  label: 'TX2',  c: PM.uart },
      { id: 'rx2',  label: 'RX2',  c: PM.uart },
      { id: 'd4',   label: 'D4',   c: PM.dig  },
      { id: 'd2',   label: 'D2',   c: PM.dig  },
      { id: 'd15',  label: 'D15',  c: PM.dig  },
      { id: 'gnd3', label: 'GND',  c: PM.gnd  },
      { id: '5v',   label: '5V',   c: PM.pwr  },
    ],
  },

  // ── Raspberry Pi Pico / RP2040 ──────────────────────────────────────────────
  pico: {
    img: '/devices/pico.png',
    w: 200, h: 360,
    color: '#00ff88',
    leftPins: [
      { id: 'gp0',  label: 'GP0',  c: PM.dig  },
      { id: 'gp1',  label: 'GP1',  c: PM.dig  },
      { id: 'gnd1', label: 'GND',  c: PM.gnd  },
      { id: 'gp2',  label: 'GP2',  c: PM.dig  },
      { id: 'gp3',  label: 'GP3',  c: PM.dig  },
      { id: 'gp4',  label: 'GP4',  c: PM.uart },
      { id: 'gp5',  label: 'GP5',  c: PM.uart },
      { id: 'gnd2', label: 'GND',  c: PM.gnd  },
      { id: 'gp6',  label: 'GP6',  c: PM.spi  },
      { id: 'gp7',  label: 'GP7',  c: PM.spi  },
      { id: 'gp8',  label: 'GP8',  c: PM.i2c  },
      { id: 'gp9',  label: 'GP9',  c: PM.i2c  },
      { id: 'gnd3', label: 'GND',  c: PM.gnd  },
      { id: 'gp10', label: 'GP10', c: PM.spi  },
      { id: 'gp11', label: 'GP11', c: PM.spi  },
      { id: 'gp12', label: 'GP12', c: PM.spi  },
      { id: 'gp13', label: 'GP13', c: PM.spi  },
      { id: 'gnd4', label: 'GND',  c: PM.gnd  },
      { id: 'gp14', label: 'GP14', c: PM.dig  },
      { id: 'gp15', label: 'GP15', c: PM.dig  },
    ],
    rightPins: [
      { id: 'vbus', label: 'VBUS', c: PM.pwr  },
      { id: 'vsys', label: 'VSYS', c: PM.pwr  },
      { id: 'gnd5', label: 'GND',  c: PM.gnd  },
      { id: '3v3e', label: '3V3E', c: PM.pwr  },
      { id: '3v3',  label: '3V3',  c: PM.pwr  },
      { id: 'adcv', label: 'ADCV', c: PM.ana  },
      { id: 'gp28', label: 'GP28', c: PM.adc  },
      { id: 'gnd6', label: 'GND',  c: PM.gnd  },
      { id: 'gp27', label: 'GP27', c: PM.adc  },
      { id: 'gp26', label: 'GP26', c: PM.adc  },
      { id: 'run',  label: 'RUN',  c: PM.dig  },
      { id: 'gp22', label: 'GP22', c: PM.dig  },
      { id: 'gnd7', label: 'GND',  c: PM.gnd  },
      { id: 'gp21', label: 'GP21', c: PM.i2c  },
      { id: 'gp20', label: 'GP20', c: PM.i2c  },
      { id: 'gp19', label: 'GP19', c: PM.spi  },
      { id: 'gp18', label: 'GP18', c: PM.spi  },
      { id: 'gnd8', label: 'GND',  c: PM.gnd  },
      { id: 'gp17', label: 'GP17', c: PM.dig  },
      { id: 'gp16', label: 'GP16', c: PM.dig  },
    ],
  },

  // ── Arduino Uno R3 ──────────────────────────────────────────────────────────
  arduino: {
    img: '/devices/arduino_uno.png',
    w: 220, h: 280,
    color: '#00aaff',
    leftPins: [
      { id: 'unref', label: 'AREF', c: PM.ana  },
      { id: 'gnd1',  label: 'GND',  c: PM.gnd  },
      { id: 'd13',   label: 'D13',  c: PM.spi  },
      { id: 'd12',   label: 'D12',  c: PM.spi  },
      { id: 'd11',   label: 'D11~', c: PM.pwm  },
      { id: 'd10',   label: 'D10~', c: PM.pwm  },
      { id: 'd9',    label: 'D9~',  c: PM.pwm  },
      { id: 'd8',    label: 'D8',   c: PM.dig  },
    ],
    rightPins: [
      { id: 'd7',    label: 'D7',   c: PM.dig  },
      { id: 'd6',    label: 'D6~',  c: PM.pwm  },
      { id: 'd5',    label: 'D5~',  c: PM.pwm  },
      { id: 'd4',    label: 'D4',   c: PM.dig  },
      { id: 'd3',    label: 'D3~',  c: PM.pwm  },
      { id: 'd2',    label: 'D2',   c: PM.dig  },
      { id: 'tx',    label: 'TX1',  c: PM.uart },
      { id: 'rx',    label: 'RX0',  c: PM.uart },
    ],
    bottomPins: [
      { id: 'a0',    label: 'A0',   c: PM.adc  },
      { id: 'a1',    label: 'A1',   c: PM.adc  },
      { id: 'a2',    label: 'A2',   c: PM.adc  },
      { id: 'a3',    label: 'A3',   c: PM.adc  },
      { id: 'a4',    label: 'A4',   c: PM.i2c  },
      { id: 'a5',    label: 'A5',   c: PM.i2c  },
    ],
    topPins: [
      { id: 'vin',   label: 'VIN',  c: PM.pwr  },
      { id: 'gnd2',  label: 'GND',  c: PM.gnd  },
      { id: 'gnd3',  label: 'GND',  c: PM.gnd  },
      { id: '5v',    label: '5V',   c: PM.pwr  },
      { id: '3v3',   label: '3.3V', c: PM.pwr  },
      { id: 'rst',   label: 'RST',  c: PM.dig  },
      { id: 'ioref', label: 'IOREF',c: PM.dig  },
    ],
  },

  // ── Raspberry Pi 4B ─────────────────────────────────────────────────────────
  raspberrypi: {
    img: '/devices/raspberrypi.png',
    w: 240, h: 340,
    color: '#3fa83f',
    leftPins: [
      { id: '3v3a',  label: '3V3',   c: PM.pwr  },
      { id: 'sda1',  label: 'SDA',   c: PM.i2c  },
      { id: 'scl1',  label: 'SCL',   c: PM.i2c  },
      { id: 'gp4',   label: 'GP4',   c: PM.dig  },
      { id: 'gnd1',  label: 'GND',   c: PM.gnd  },
      { id: 'gp17',  label: 'GP17',  c: PM.dig  },
      { id: 'gp27',  label: 'GP27',  c: PM.dig  },
      { id: 'gnd2',  label: 'GND',   c: PM.gnd  },
      { id: 'gp22',  label: 'GP22',  c: PM.dig  },
      { id: '3v3b',  label: '3V3',   c: PM.pwr  },
      { id: 'mosi',  label: 'MOSI',  c: PM.spi  },
      { id: 'miso',  label: 'MISO',  c: PM.spi  },
      { id: 'sclk',  label: 'SCLK',  c: PM.spi  },
      { id: 'gnd3',  label: 'GND',   c: PM.gnd  },
      { id: 'idsd',  label: 'ID_SD', c: PM.i2c  },
      { id: 'gp5',   label: 'GP5',   c: PM.dig  },
      { id: 'gp6',   label: 'GP6',   c: PM.dig  },
      { id: 'gp13',  label: 'GP13',  c: PM.pwm  },
      { id: 'gnd4',  label: 'GND',   c: PM.gnd  },
      { id: 'gp19',  label: 'GP19',  c: PM.spi  },
      { id: 'gnd5',  label: 'GND',   c: PM.gnd  },
    ],
    rightPins: [
      { id: '5va',   label: '5V',    c: PM.pwr  },
      { id: '5vb',   label: '5V',    c: PM.pwr  },
      { id: 'gnd6',  label: 'GND',   c: PM.gnd  },
      { id: 'txd',   label: 'TXD',   c: PM.uart },
      { id: 'rxd',   label: 'RXD',   c: PM.uart },
      { id: 'gp18',  label: 'GP18',  c: PM.pwm  },
      { id: 'gnd7',  label: 'GND',   c: PM.gnd  },
      { id: 'gp23',  label: 'GP23',  c: PM.dig  },
      { id: 'gp24',  label: 'GP24',  c: PM.dig  },
      { id: 'gnd8',  label: 'GND',   c: PM.gnd  },
      { id: 'ce0',   label: 'CE0',   c: PM.spi  },
      { id: 'gnd9',  label: 'GND',   c: PM.gnd  },
      { id: 'ce1',   label: 'CE1',   c: PM.spi  },
      { id: 'idsc',  label: 'ID_SC', c: PM.i2c  },
      { id: 'gnd10', label: 'GND',   c: PM.gnd  },
      { id: 'gp12',  label: 'GP12',  c: PM.pwm  },
      { id: 'gnd11', label: 'GND',   c: PM.gnd  },
      { id: 'gp16',  label: 'GP16',  c: PM.spi  },
      { id: 'gp26',  label: 'GP26',  c: PM.dig  },
      { id: 'gp20',  label: 'GP20',  c: PM.spi  },
      { id: 'gp21',  label: 'GP21',  c: PM.spi  },
    ],
  },
};

// ─── Pin Row Component ────────────────────────────────────────────────────────
function PinRow({ pins, side, gpioStates }) {
  const [hovered, setHovered] = useState(null);
  const isLeft  = side === 'left';
  const isRight = side === 'right';
  const isTop   = side === 'top';
  const isBot   = side === 'bottom';

  const flexDir = (isTop || isBot) ? 'row' : 'column';
  const pos     = isLeft ? Position.Left : isRight ? Position.Right
                : isTop  ? Position.Top  : Position.Bottom;

  return (
    <div style={{
      display: 'flex', flexDirection: flexDir,
      justifyContent: 'space-between', alignItems: 'center',
      gap: isTop || isBot ? 4 : 2,
    }}>
      {pins.map(pin => {
        const isHigh    = gpioStates?.[pin.id] === 'HIGH';
        const pinActive = isHigh;

        return (
          <div
            key={pin.id}
            onMouseEnter={() => setHovered(pin.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: isLeft ? 'row' : isRight ? 'row-reverse' : 'column',
              alignItems: 'center',
              gap: 3,
              padding: '1px 0',
            }}
          >
            {/* Pin label */}
            <span style={{
              fontSize: '6.5px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: hovered === pin.id ? '#fff' : pin.c,
              whiteSpace: 'nowrap',
              textShadow: pinActive ? `0 0 4px ${pin.c}` : '1px 1px 2px #000',
              lineHeight: 1,
              transition: 'color 0.15s',
            }}>
              {pin.label}
            </span>

            {/* Handle dot */}
            <Handle
              type="source"
              position={pos}
              id={pin.id}
              style={{
                position: 'static',
                width: 9, height: 9,
                borderRadius: '50%',
                background: pinActive ? pin.c : 'var(--sim-handle-bg)',
                border: `1.5px solid ${pin.c}`,
                boxShadow: pinActive ? `0 0 6px ${pin.c}` : 'none',
                cursor: 'crosshair',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            />

            {/* Tooltip */}
            {hovered === pin.id && (
              <div style={{
                position: 'absolute',
                ...(isLeft  ? { left: '110%', top: '50%', transform: 'translateY(-50%)' } : {}),
                ...(isRight ? { right: '110%', top: '50%', transform: 'translateY(-50%)' } : {}),
                ...(isTop   ? { top: '120%',  left: '50%', transform: 'translateX(-50%)' } : {}),
                ...(isBot   ? { bottom: '120%', left: '50%', transform: 'translateX(-50%)' } : {}),
                background: 'rgba(0,0,0,0.95)',
                color: pin.c,
                padding: '3px 7px',
                borderRadius: 4,
                fontSize: '0.65rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                border: `1px solid ${pin.c}44`,
                zIndex: 999,
                pointerEvents: 'none',
                boxShadow: `0 0 8px ${pin.c}33`,
              }}>
                {pin.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main MicrocontrollerNode ─────────────────────────────────────────────────
export const MicrocontrollerNode = memo(({ data, selected }) => {
  const boardKey = data?.boardType || 'esp32';
  const board    = BOARDS[boardKey] || BOARDS.esp32;
  const states   = data?.gpioStates || {};
  const isRunning = data?.isRunning || false;

  const PIN_MARGIN = 8;  // px between image edge and the pin row

  return (
    <div style={{
      position: 'relative',
      width: board.w + (board.leftPins?.length  ? 60 : 0)
                     + (board.rightPins?.length ? 60 : 0),
      height: board.h + (board.topPins?.length    ? 30 : 0)
                      + (board.bottomPins?.length ? 30 : 0),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      userSelect: 'none',
    }}>

      {/* ── TOP PINS ── */}
      {board.topPins && (
        <div style={{
          width: board.w,
          marginLeft: board.leftPins?.length ? 60 : 0,
          display: 'flex', justifyContent: 'center',
          paddingBottom: PIN_MARGIN,
        }}>
          <PinRow pins={board.topPins} side="top" gpioStates={states} />
        </div>
      )}

      {/* ── MIDDLE ROW: left pins + image + right pins ── */}
      <div style={{ display: 'flex', alignItems: 'center' }}>

        {/* LEFT PINS */}
        {board.leftPins && (
          <div style={{
            width: 60, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-around',
            height: board.h - (board.topPins ? 30 : 0) - (board.bottomPins ? 30 : 0),
            paddingRight: PIN_MARGIN,
            alignItems: 'flex-end',
          }}>
            <PinRow pins={board.leftPins} side="left" gpioStates={states} />
          </div>
        )}

        {/* BOARD IMAGE */}
        <div style={{
          width: board.w,
          height: board.h - (board.topPins ? 30 : 0) - (board.bottomPins ? 30 : 0),
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: selected
            ? `0 0 0 2px ${board.color}, 0 0 20px ${board.color}66`
            : '0 4px 20px rgba(0,0,0,0.6)',
          transition: 'box-shadow 0.2s',
        }}>
          <img
            src={board.img}
            alt={boardKey}
            onError={e => { e.target.src = '/devices/sensor_generic.png'; }}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          />

          {/* Running indicator */}
          {isRunning && (
            <div style={{
              position: 'absolute', top: 6, right: 6,
              width: 9, height: 9, borderRadius: '50%',
              background: '#10b981', boxShadow: '0 0 8px #10b981',
              animation: 'mcuBlink 1.2s ease-in-out infinite',
            }} />
          )}

          {/* Board label */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.72)',
            color: board.color, fontSize: '7px', fontWeight: 800,
            fontFamily: 'monospace', textAlign: 'center',
            padding: '2px 0', letterSpacing: '0.5px',
          }}>
            {boardKey === 'esp32'       ? 'ESP32 WROOM-32'
           : boardKey === 'pico'        ? 'RP2040 PICO'
           : boardKey === 'arduino'     ? 'ARDUINO UNO R3'
           : boardKey === 'raspberrypi' ? 'RASPBERRY PI 4B'
           : boardKey.toUpperCase()}
          </div>
        </div>

        {/* RIGHT PINS */}
        {board.rightPins && (
          <div style={{
            width: 60, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-around',
            height: board.h - (board.topPins ? 30 : 0) - (board.bottomPins ? 30 : 0),
            paddingLeft: PIN_MARGIN,
            alignItems: 'flex-start',
          }}>
            <PinRow pins={board.rightPins} side="right" gpioStates={states} />
          </div>
        )}
      </div>

      {/* ── BOTTOM PINS ── */}
      {board.bottomPins && (
        <div style={{
          width: board.w,
          marginLeft: board.leftPins?.length ? 60 : 0,
          display: 'flex', justifyContent: 'center',
          paddingTop: PIN_MARGIN,
        }}>
          <PinRow pins={board.bottomPins} side="bottom" gpioStates={states} />
        </div>
      )}

      <style>{`
        @keyframes mcuBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
});

MicrocontrollerNode.displayName = 'MicrocontrollerNode';

// Export board keys so the palette can list them
export const BOARD_KEYS = Object.keys(BOARDS);
export { BOARDS };