'use client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation'; // <--- 1. Router import
import { useAuth } from '@/context/AuthContext'; // <--- 2. AuthContext import

const BACKEND = typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000';

function Toast({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 200,
      padding: '10px 20px', background: 'var(--bg2)',
      border: `1px solid ${ok ? 'rgba(0,255,136,.3)' : 'rgba(255,85,0,.3)'}`,
      color: ok ? 'var(--green)' : 'var(--orange)',
      fontWeight: 600, fontSize: '0.82rem',
      fontFamily: "'JetBrains Mono', monospace",
      animation: 'fadeUp 0.3s ease both',
    }}>{msg}</div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth(); // <--- 3. Auth states
  const router = useRouter();

  const [status, setStatus]       = useState({ running: true, speedLabel: 'normal', activeSensors: 3, logCount: 0, uptimeSeconds: 0 });
  const [gpioState, setGpio]      = useState({});
  const [logLines, setLog]        = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [curSpeed, setCurSpd]     = useState('normal');
  const [sensors, setSensors]     = useState({ temperature: true, motion: true, light: true });
  const [toast, setToast]         = useState({ msg: '', ok: true });
  const [activeTab, setActiveTab] = useState('log');
  const socketRef = useRef(null);

  // 4. Protection Logic
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signup');
    }
  }, [user, loading, router]);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 2500);
  }

  function formatUptime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  }

  useEffect(() => {
    if (!user) return; // Login nahi hai toh data fetch mat karo

    fetch(`${BACKEND}/api/admin/status`)
      .then(r => r.json())
      .then(d => {
        setStatus(d);
        setCurSpd(d.speedLabel || 'normal');
        if (d.sensors) {
          setSensors({
            temperature: d.sensors.temperature?.enabled ?? true,
            motion:      d.sensors.motion?.enabled ?? true,
            light:       d.sensors.light?.enabled ?? true,
          });
        }
        if (d.gpio) setGpio(d.gpio);
      })
      .catch(() => showToast('Backend offline — start node server.js', false));

    fetch(`${BACKEND}/api/admin/log?limit=100`)
      .then(r => r.json()).then(setLog);
    fetch(`${BACKEND}/api/admin/alerts`)
      .then(r => r.json()).then(setAlerts);

    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('sensorData', ({ gpio, log }) => {
      if (gpio) setGpio(gpio);
      if (log)  setLog(prev => {
        const merged = [...log, ...prev];
        const seen   = new Set();
        return merged.filter(e => {
          const key = e.time + e.message;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 100);
      });
    });

    const ticker = setInterval(() => {
      setStatus(prev => ({ ...prev, uptimeSeconds: prev.uptimeSeconds + 1 }));
    }, 1000);

    return () => {
      socket.disconnect();
      clearInterval(ticker);
    };
  }, [user]);

  // Rest of the functions (toggleSim, setSpeed, etc.) remain same...
  async function toggleSim() {
    const r = await fetch(`${BACKEND}/api/admin/toggle`, { method: 'POST' });
    const d = await r.json();
    setStatus(prev => ({ ...prev, running: d.running, activeSensors: d.activeSensors }));
    showToast(d.running ? '▶ Simulation resumed' : '⏸ Simulation paused');
  }

  async function setSpeed(speed) {
    const r = await fetch(`${BACKEND}/api/admin/speed`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    });
    const d = await r.json();
    if (d.success) { setCurSpd(speed); showToast(`Speed → ${speed}`); }
  }

  async function manualTick() {
    await fetch(`${BACKEND}/api/simulate`, { method: 'POST' });
    showToast('▶ Manual tick sent');
  }

  async function sendToggle(sensor, enabled) {
    const r = await fetch(`${BACKEND}/api/sensors`);
    const d = await r.json();
    const config = { ...(d.config?.[sensor] || {}), enabled };
    await fetch(`${BACKEND}/api/sensors`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensor, config }),
    });
    setSensors(prev => ({ ...prev, [sensor]: enabled }));
    setStatus(prev => ({
      ...prev,
      activeSensors: Object.values({ ...sensors, [sensor]: enabled }).filter(Boolean).length,
    }));
    showToast(`${sensor} → ${enabled ? 'ON' : 'OFF'}`);
  }

  async function doExport() {
    const r = await fetch(`${BACKEND}/api/admin/export`);
    const d = await r.json();
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const a     = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `iot_export_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
    a.click();
    showToast('✓ Export downloaded');
  }

  async function doReset() {
    if (!confirm('Reset all sensors and logs to defaults?')) return;
    const r = await fetch(`${BACKEND}/api/admin/reset`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
      setLog([]); setAlerts([]);
      setSensors({ temperature: true, motion: true, light: true });
      setCurSpd('normal');
      setStatus(prev => ({ ...prev, running: true, speedLabel: 'normal', activeSensors: 3, logCount: 0 }));
      showToast('✓ System reset to defaults');
    }
  }

  // 5. Access Check UI
  if (loading || !user) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
        Verifying Administrative Privileges...
      </div>
    );
  }

  const activeSensorsCount = Object.values(sensors).filter(Boolean).length;

  return (
    <>
      {/* ── Header ── */}
      <div style={{ padding: '3rem 3rem 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '1.5rem' }}>
          <div>
            <div className="label label-orange" style={{ marginBottom: '0.5rem' }}>▸ System Administration</div>
            <h1 className="display display-lg">ADMIN PANEL_</h1>
          </div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            <div style={{ padding: '0 1.25rem', border: '1px solid var(--border)', height: 44, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={status.running ? 'blink' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: status.running ? 'var(--green)' : 'var(--orange)' }} />
              <span className="mono" style={{ fontSize: '0.75rem', color: status.running ? 'var(--green)' : 'var(--orange)' }}>
                {status.running ? 'SYSTEM ONLINE' : 'PAUSED'}
              </span>
            </div>
            <button onClick={doExport} className="btn-ghost" style={{ borderLeft: 'none', height: 44 }}>⬇ EXPORT JSON</button>
            <button onClick={doReset}  className="btn-ghost" style={{ borderLeft: 'none', height: 44, color: 'var(--red)', borderColor: 'rgba(255,51,85,.2)' }}>⚠ RESET ALL</button>
          </div>
        </div>
      </div>

      {/* ── Status Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', background: 'var(--border)', gap: '1px', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'System Status',   val: status.running ? 'RUNNING' : 'PAUSED', color: status.running ? 'var(--green)' : 'var(--orange)' },
          { label: 'Active Sensors',  val: String(activeSensorsCount), color: activeSensorsCount > 0 ? 'var(--text)' : 'var(--red)' },
          { label: 'Sim Speed',       val: (curSpeed).toUpperCase(), color: 'var(--orange)' },
          { label: 'Log Entries',     val: String(logLines.length) },
          { label: 'Uptime',          val: formatUptime(status.uptimeSeconds || 0), color: 'var(--blue)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg)', padding: '1.5rem 2rem', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div className="label" style={{ marginBottom: '0.6rem' }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: s.color || 'var(--text)' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Controls + Log + GPIO ── */}
      <div style={{ padding: '2rem 3rem', display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: '1.25rem' }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          <div style={{ background: 'var(--bg)', padding: '1.5rem' }}>
            <div className="label label-orange" style={{ marginBottom: '1rem' }}>Simulation Speed</div>
            <div style={{ display: 'flex', gap: 0, background: 'var(--border)', padding: '1px' }}>
              {['slow', 'normal', 'fast'].map(s => (
                <button key={s} onClick={() => setSpeed(s)} className="btn-ghost" style={{
                  flex: 1, border: 'none', borderRight: s !== 'fast' ? '1px solid var(--border)' : 'none',
                  background: curSpeed === s ? 'var(--orange-bg)' : 'transparent',
                  color: curSpeed === s ? 'var(--orange)' : 'var(--muted)',
                  textTransform: 'uppercase', height: 36,
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg)', padding: '1.5rem' }}>
            <div className="label label-orange" style={{ marginBottom: '1rem' }}>Simulation Control</div>
            <button onClick={toggleSim} className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}>
              {status.running ? '⏸ PAUSE SIMULATION' : '▶ RESUME SIMULATION'}
            </button>
            <button onClick={manualTick} className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>▶ SINGLE STEP</button>
          </div>
          <div style={{ background: 'var(--bg)', padding: '1.5rem', flex: 1 }}>
            <div className="label label-orange" style={{ marginBottom: '1rem' }}>Sensor Toggles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'temperature', label: 'DHT11 · GPIO17', color: 'var(--orange)' },
                { key: 'motion',      label: 'PIR · GPIO22',   color: 'var(--green)' },
                { key: 'light',       label: 'LDR · GPIO24',   color: 'var(--blue)' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color }}>{label}</span>
                    <div style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: sensors[key] ? 'var(--green)' : 'var(--muted)', marginTop: 2 }}>
                      {sensors[key] ? '● ACTIVE' : '○ DISABLED'}
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={sensors[key]} onChange={e => sendToggle(key, e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Log */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
            {[
              { id: 'log',    label: `ALL LOGS (${logLines.length})` },
              { id: 'alerts', label: `⚠ ALERTS (${alerts.length})`, danger: true },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '0 1.25rem', height: 40, background: 'transparent',
                border: 'none', borderBottom: activeTab === tab.id ? `2px solid ${tab.danger ? 'var(--red)' : 'var(--orange)'}` : '2px solid transparent',
                color: activeTab === tab.id ? (tab.danger ? 'var(--red)' : 'var(--orange)') : 'var(--muted)',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600,
              }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', maxHeight: 480, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
            {(activeTab === 'alerts' ? alerts : logLines).map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: '0.68rem' }}>{e.time}</span>
                <span style={{ color: e.level === 'alert' ? 'var(--orange)' : 'var(--text)' }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: GPIO Table */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }} className="label label-orange">GPIO Pin States</div>
          <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
            {Object.entries(gpioState).map(([pin, info]) => (
              <div key={pin} style={{ display: 'grid', gridTemplateColumns: '60px 55px 1fr', padding: '5px 10px', fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: [17,22,24].includes(+pin) ? 'var(--orange)' : 'var(--muted)' }}>GPIO{pin}</span>
                <span style={{ color: info.state === 'HIGH' ? 'var(--green)' : 'var(--muted)' }}>{info.state}</span>
                <span style={{ color: 'var(--muted)' }}>{info.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Toast msg={toast.msg} ok={toast.ok} />
    </>
  );
}