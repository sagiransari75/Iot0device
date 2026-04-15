'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation'; // <--- 1. Router import kiya
import { useAuth } from '@/context/AuthContext'; // <--- 2. AuthContext import kiya

const BACKEND = typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000';

const META = {
  temperature: { label: 'DHT11 / DHT22', sub: 'Temperature', col: '#ff5500', minMax: [-20, 60], unit: '°C' },
  motion:      { label: 'PIR HC-SR501',  sub: 'Motion',       col: '#00ff88', sens: true },
  light:       { label: 'LDR Module',    sub: 'Light',        col: '#0099ff', thr: [0, 1000], unit: ' lux' },
  distance:    { label: 'HC-SR04',       sub: 'Distance',     col: '#aa44ff', minMax: [2, 400], unit: ' cm' },
  gas:         { label: 'MQ-2',          sub: 'Gas / Smoke', col: '#ff4444', minMax: [50, 10000], unit: ' ppm' },
  humidity:    { label: 'DHT11 / DHT22', sub: 'Humidity',     col: '#00e1ff', minMax: [0, 100], unit: '%' },
  pressure:    { label: 'BME280',        sub: 'Pressure',     col: '#ffaa00', minMax: [300, 1100], unit: ' hPa' },
  sound:       { label: 'KY-037',        sub: 'Sound',        col: '#44ffaa', sens: true },
};

function Toast({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 200, padding: '10px 20px', background: 'var(--bg2)',
      border: `1px solid ${ok ? 'rgba(0,255,136,.3)' : 'rgba(255,51,85,.3)'}`, color: ok ? 'var(--green)' : 'var(--red)',
      fontWeight: 600, fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace'
    }}>{msg}</div>
  );
}

export default function SensorsPage() {
  const { user, loading } = useAuth(); // <--- 3. User aur loading state nikaali
  const router = useRouter(); // <--- 4. Router initialize kiya
  
  const [config, setConfig] = useState(null);
  const [liveData, setLiveData] = useState({});
  const [toast, setToast] = useState({ msg: '', ok: true });

  // 5. Smart Protection Logic
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signup');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) { // Sirf login user ke liye data fetch karein
      fetch(`${BACKEND}/api/sensors`).then(r => r.json()).then(d => setConfig(d.config));
      
      const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
      socket.on('sensorData', ({ data }) => {
        if (data) setLiveData(prev => ({ ...prev, ...data }));
      });
      return () => socket.disconnect();
    }
  }, [user]);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 2500);
  }

  async function applyConfig(sensorKey, newCfg) {
    const r = await fetch(`${BACKEND}/api/sensors`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensor: sensorKey, config: newCfg }),
    });
    const d = await r.json();
    if (d.success) showToast(`✓ ${META[sensorKey].sub} updated`);
    else showToast('✗ Failed to update', false);
  }

  // 6. Loading ya Unauthorized state handle karein
  if (loading || !user) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
        Authenticating access...
      </div>
    );
  }

  if (!config) return <div style={{ padding: '3rem' }}>Loading configurations...</div>;

  return (
    <>
      <div style={{ padding: '3rem 3rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div className="label label-orange" style={{ marginBottom: '0.5rem' }}>▸ Sensor Fine-tuning</div>
        <h1 className="display display-lg">CONFIGURE SENSORS_</h1>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>Adjust minimum, maximum, thresholds and sensitivities for simulation generation.</p>
      </div>

      <div style={{ padding: '2rem 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {Object.entries(config).map(([key, cfg], index) => {
          const meta = META[key];
          if (!meta) return null;
          
          return (
            <div key={key} style={{ background: 'var(--bg2)', padding: '1.5rem', border: `1px solid ${meta.col}30`, borderTop: `3px solid ${meta.col}`, opacity: cfg.enabled ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: meta.col, letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>0{index+1} · {meta.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Syne' }}>{meta.sub}</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={cfg.enabled} onChange={e => {
                    const next = { ...cfg, enabled: e.target.checked };
                    setConfig({ ...config, [key]: next });
                    applyConfig(key, next);
                  }} />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div style={{ marginBottom: 16, height: 36, display: 'flex', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '1.5rem', color: liveData[key] !== undefined ? meta.col : 'var(--muted)' }}>
                  {liveData[key] !== undefined 
                    ? (typeof liveData[key] === 'boolean' ? (liveData[key] ? 'DETECTED' : 'CLEAR') : `${liveData[key]}${meta.unit}`) 
                    : '--'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted2)', marginLeft: 12 }}>LIVE OUT</span>
              </div>

              {/* Range sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {meta.minMax && (
                  <>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
                        <span>MINIMUM</span><span className="mono" style={{ color: meta.col }}>{cfg.min}</span>
                      </div>
                      <input type="range" min={meta.minMax[0]} max={meta.minMax[1]} value={cfg.min} onChange={e => setConfig({...config, [key]: {...cfg, min: +e.target.value}})} style={{ accentColor: meta.col }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
                        <span>MAXIMUM</span><span className="mono" style={{ color: meta.col }}>{cfg.max}</span>
                      </div>
                      <input type="range" min={meta.minMax[0]} max={meta.minMax[1]} value={cfg.max} onChange={e => setConfig({...config, [key]: {...cfg, max: +e.target.value}})} style={{ accentColor: meta.col }} />
                    </div>
                  </>
                )}
                {meta.thr && (
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
                      <span>THRESHOLD</span><span className="mono" style={{ color: meta.col }}>{cfg.threshold}</span>
                    </div>
                    <input type="range" min={meta.thr[0]} max={meta.thr[1]} value={cfg.threshold} onChange={e => setConfig({...config, [key]: {...cfg, threshold: +e.target.value}})} style={{ accentColor: meta.col }} />
                  </div>
                )}
                {meta.sens && (
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
                      <span>SENSITIVITY</span><span className="mono" style={{ color: meta.col }}>{Math.round(cfg.sensitivity * 100)}%</span>
                    </div>
                    <input type="range" min="5" max="95" value={Math.round(cfg.sensitivity * 100)} onChange={e => setConfig({...config, [key]: {...cfg, sensitivity: +(e.target.value)/100}})} style={{ accentColor: meta.col }} />
                  </div>
                )}
                <button className="btn-outline" onClick={() => applyConfig(key, config[key])} style={{ width: '100%', borderColor: `${meta.col}40`, color: meta.col, marginTop: 8 }}>APPLY</button>
              </div>
            </div>
          );
        })}
      </div>
      <Toast msg={toast.msg} ok={toast.ok} />
    </>
  );
}