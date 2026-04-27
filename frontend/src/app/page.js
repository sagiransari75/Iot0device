'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000');

const features = [
  { num: '01', title: 'GPIO VISUALIZER',      desc: 'Interactive Raspberry Pi 40-pin GPIO header. Click any pin to inspect function, see real-time HIGH/LOW state changes.' },
  { num: '02', title: 'SENSOR SIMULATION',   desc: 'Simulate DHT11 Temperature, PIR Motion, and LDR Light sensors with configurable ranges and live data generation.' },
  { num: '03', title: 'LIVE DASHBOARD',      desc: 'Real-time Chart.js graphs updating every 2 seconds via Socket.IO. Temperature trends, light levels, and motion events.' },
  { num: '04', title: 'PYTHON CODE EDITOR',  desc: 'Write and view real GPIO Python code in the Wokwi-style simulator IDE. Serial monitor shows live output.' },
  { num: '05', title: 'ADMIN CONTROL',       desc: 'Adjust simulation speed, pause/resume, reset sensors, and export JSON data logs through the admin panel.' },
  { num: '06', title: 'ZERO RISK',           desc: 'No hardware. No voltage damage. No incorrect wiring risk. Experiment freely in a fully safe virtual environment.' },
  { num: '07', title: 'ACTIVITY HISTORY',    desc: 'Every connection and sensor event is logged to your profile. View your complete simulation timeline anytime.' }, // <--- Naya Feature ADDED
];

const stats = [
  { value: '18.8B', label: 'IoT Devices by 2024', orange: true },
  { value: '70%',   label: 'Prefer virtual labs' },
  { value: '60%',   label: 'Cost reduction', orange: true },
  { value: '$293B', label: 'IoT Market 2026' },
  { value: '40B',   label: 'Devices by 2030', orange: true },
];

export default function HomePage() {
  const { user } = useAuth(); 
  const [sensorData, setSensorData] = useState({ temperature: null, motion: null, light: null });

  useEffect(() => {
    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socket.on('sensorData', ({ data }) => {
      if (data) setSensorData(prev => ({ ...prev, ...data }));
    });
    return () => socket.disconnect();
  }, []);

  const hot = sensorData.temperature > 35;

  // Smart Link Logic
  const simTarget = user ? "/simulator" : "/signup";
  const historyTarget = user ? "/history" : "/signup"; // <--- Naya Target ADDED

  return (
    <>
      {/* ── HERO ── */}
      <section style={{ borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 56px)' }}>
        {/* Left */}
        <div style={{ padding: '5rem 3rem 4rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
          <div>
            <div className="label animate-up">▸ Virtual IoT Learning Platform</div>
            <div style={{ width: 32, height: 2, background: 'var(--orange)', marginTop: 12 }} />
          </div>
          <h1 className="display display-xl animate-up delay-1">
            RASPBERRY<br />PI IoT<br /><span style={{ color: 'var(--orange)' }}>SIMULATOR_</span>
          </h1>
          <p className="animate-up delay-2" style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 480 }}>
            Simulate GPIO pin connections, generate real sensor data, and visualize IoT data flows — entirely in your browser. No hardware needed.
          </p>
          <div className="animate-up delay-3" style={{ display: 'flex', gap: 0, marginTop: '0.5rem' }}>
            <Link href={simTarget} className="btn-orange" style={{ gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              LAUNCH SIMULATOR
            </Link>
            <Link href="/dashboard" className="btn-outline" style={{ borderLeft: 'none' }}>VIEW DASHBOARD</Link>
            
            {/* ADDED: Naya History Button (Sirf login user ko dikhega) */}
            {user && (
              <Link href="/history" className="btn-outline" style={{ borderLeft: 'none', color: 'var(--orange)' }}>VIEW HISTORY</Link>
            )}
          </div>
        </div>

        {/* Right Section (Circuit SVG - No changes) */}
        <div style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 20, right: 20, width: 20, height: 20, borderTop: '2px solid var(--orange)', borderRight: '2px solid var(--orange)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 20, width: 20, height: 20, borderBottom: '2px solid var(--orange)', borderLeft: '2px solid var(--orange)' }} />
          <svg viewBox="0 0 420 360" style={{ width: '100%', maxWidth: 420, margin: '0 auto' }} fill="none">
            <rect x="20" y="60" width="130" height="240" rx="4" stroke="#2a2a35" strokeWidth="1.5" fill="#111116" />
            <text x="85" y="80" textAnchor="middle" fill="#3a3a4a" fontSize="7" fontFamily="JetBrains Mono">RASPBERRY PI 4B</text>
            <rect x="45" y="90" width="80" height="55" rx="2" fill="#17171e" stroke="#2a2a35" />
            <text x="85" y="121" textAnchor="middle" fill="#3a3a4a" fontSize="7" fontFamily="JetBrains Mono">BCM2711</text>
            <g fill="none">
              <rect x="144" y="100" width="8" height="6" rx="1" fill="#ff5500" opacity=".7" />
              <rect x="144" y="112" width="8" height="6" rx="1" fill="#555" />
              <rect x="144" y="124" width="8" height="6" rx="1" fill="#ffd32a" />
              <rect x="144" y="136" width="8" height="6" rx="1" fill="#00ff88" />
              <rect x="144" y="148" width="8" height="6" rx="1" fill="#0099ff" />
            </g>
            <path d="M152 127 H200 V165 H250" stroke="#ffd32a" strokeWidth="2" strokeLinecap="round" />
            <path d="M152 139 H195 V245 H250" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" />
            <path d="M152 151 H190 V325 H250" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" />
            <rect x="250" y="148" width="100" height="46" rx="3" fill="#111116" stroke="#ffd32a" strokeWidth="1.2" />
            <text x="300" y="167" textAnchor="middle" fill="#ffd32a" fontSize="8" fontFamily="JetBrains Mono" fontWeight="700">DHT11</text>
            <text x="300" y="180" textAnchor="middle" fill="#555" fontSize="6.5" fontFamily="JetBrains Mono">TEMP SENSOR</text>
            <text x="300" y="191" textAnchor="middle" fill={hot ? '#ff5500' : '#00ff88'} fontSize="7.5" fontFamily="JetBrains Mono">
              {sensorData.temperature !== null ? `${sensorData.temperature}°C` : '--.-°C'}
            </text>
            <rect x="250" y="228" width="100" height="46" rx="3" fill="#111116" stroke="#00ff88" strokeWidth="1.2" />
            <text x="300" y="247" textAnchor="middle" fill="#00ff88" fontSize="8" fontFamily="JetBrains Mono" fontWeight="700">PIR</text>
            <text x="300" y="260" textAnchor="middle" fill="#555" fontSize="6.5" fontFamily="JetBrains Mono">MOTION SENSOR</text>
            <text x="300" y="271" textAnchor="middle" fill="#00ff88" fontSize="7.5" fontFamily="JetBrains Mono">
              {sensorData.motion !== null && sensorData.motion !== undefined ? (sensorData.motion ? 'DETECTED' : 'CLEAR') : 'CLEAR'}
            </text>
            <rect x="250" y="308" width="100" height="46" rx="3" fill="#111116" stroke="#0099ff" strokeWidth="1.2" />
            <text x="300" y="327" textAnchor="middle" fill="#0099ff" fontSize="8" fontFamily="JetBrains Mono" fontWeight="700">LDR</text>
            <text x="300" y="340" textAnchor="middle" fill="#555" fontSize="6.5" fontFamily="JetBrains Mono">LIGHT SENSOR</text>
            <text x="300" y="351" textAnchor="middle" fill="#00ff88" fontSize="7.5" fontFamily="JetBrains Mono">
              {sensorData.light !== null ? `${sensorData.light} lux` : '--- lux'}
            </text>
            <circle cx="380" cy="80" r="4" fill="#00ff88" />
            <text x="390" y="84" fill="#00ff88" fontSize="7" fontFamily="JetBrains Mono">LIVE</text>
          </svg>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid var(--border)', marginTop: '2rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border)' }}>
              <div className="stat-num" style={{ fontSize: '1.8rem', color: 'var(--orange)' }}>
                {sensorData.temperature !== null ? `${sensorData.temperature}°C` : '--°C'}
              </div>
              <div className="stat-label">Temperature</div>
            </div>
            <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border)' }}>
              <div className="stat-num" style={{ fontSize: '1.8rem', color: sensorData.motion ? 'var(--orange)' : 'var(--text)' }}>
                {sensorData.motion !== null && sensorData.motion !== undefined ? (sensorData.motion ? 'MOTION' : 'IDLE') : 'IDLE'}
              </div>
              <div className="stat-label">Motion</div>
            </div>
            <div style={{ padding: '1rem 1.25rem' }}>
              <div className="stat-num" style={{ fontSize: '1.8rem', color: 'var(--blue)' }}>
                {sensorData.light !== null ? sensorData.light : '---'}
              </div>
              <div className="stat-label">Light (lux)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW (No Changes) ── */}
      <section style={{ borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '2rem', borderRight: i < 4 ? '1px solid var(--border)' : 'none' }}>
            <div className="stat-num" style={s.orange ? { color: 'var(--orange)' } : {}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '5rem 3rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2rem', marginBottom: '3.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div className="label label-orange">▸ Core Features</div>
          <h2 className="display display-md">WHAT THIS PLATFORM DOES_</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--border)' }}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{ background: 'var(--bg)', padding: '2.5rem 2rem', transition: '0.2s', borderLeft: i % 3 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', cursor: 'default' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--bg)'}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--orange)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '1rem' }}>{f.num}</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '5rem 3rem', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2rem' }}>
        <div>
          <div className="label label-orange" style={{ marginBottom: '1rem' }}>▸ Ready to simulate?</div>
          <h2 className="display display-lg">START WITHOUT<br />HARDWARE_</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href={simTarget} className="btn-orange">OPEN SIMULATOR →</Link>
          <Link href="/dashboard" className="btn-outline">VIEW LIVE DATA →</Link>
          {/* ADDED: CTA History Link */}
          <Link href={historyTarget} className="btn-outline" style={{ borderTop: 'none' }}>VIEW MY ACTIVITY LOGS →</Link>
        </div>
      </section>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}