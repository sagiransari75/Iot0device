'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation'; // <--- 1. Router import kiya
import { useAuth } from '@/context/AuthContext'; // <--- 2. AuthContext import kiya
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const BACKEND = typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000';
const MAX_PTS  = 20;

const chartOpts = (color) => ({
  responsive: true,
  animation:  { duration: 300 },
  plugins:    { legend: { display: false }, tooltip: {
    backgroundColor: 'var(--bg)',
    borderColor: color, borderWidth: 1,
    titleColor: 'var(--text)',
    bodyColor: 'var(--muted)',
    titleFont: { family: 'JetBrains Mono', size: 11 },
    bodyFont:  { family: 'JetBrains Mono', size: 11 },
  }},
  scales: {
    x: {
      ticks: { maxTicksLimit: 6, font: { size: 10, family: 'JetBrains Mono' }, color: 'var(--muted)' },
      grid:  { color: 'var(--border2)' },
    },
    y: {
      ticks: { font: { size: 10, family: 'JetBrains Mono' }, color: 'var(--muted)' },
      grid:  { color: 'var(--border2)' },
    },
  },
});

function makeChartData(color, labels = [], data = []) {
  return {
    labels,
    datasets: [{
      data,
      borderColor:     color,
      backgroundColor: color + '18',
      borderWidth: 2, fill: true, tension: 0.4,
      pointRadius: 2, pointBackgroundColor: color,
    }],
  };
}

export default function DashboardPage() {
  const { user, loading } = useAuth(); // <--- 3. Auth states nikaali
  const router = useRouter();

  const [paused, setPaused]       = useState(false);
  const [count,  setCount]         = useState(0);
  const [lastUpdate, setLast]     = useState('—');
  const [tempVal,    setTempVal]  = useState('--.-°C');
  const [motionVal,  setMotion]   = useState('IDLE');
  const [lightVal,   setLight]    = useState('--- lux');
  const [tempTag,    setTempTag]  = useState({ cls: 'tag-white', text: 'WAITING' });
  const [motionTag,  setMotionTag]= useState({ cls: 'tag-white', text: 'WAITING' });
  const [lightTag,   setLightTag] = useState({ cls: 'tag-white', text: 'WAITING' });
  const [eventLog,   setEventLog] = useState([]);
  const [stats,      setStats]    = useState({ speedLabel: 'normal', activeSensors: 3, uptimeSeconds: 0 });

  const tData = useRef(makeChartData('#ff5500'));
  const mData = useRef(makeChartData('#00ff88'));
  const lData = useRef(makeChartData('#0099ff'));
  const tRef  = useRef(null);
  const mRef  = useRef(null);
  const lRef  = useRef(null);
  const pauseRef = useRef(false);

  // 4. Protection Logic: Agar login nahi hai toh signup par bhej do
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signup');
    }
  }, [user, loading, router]);

  function pushChart(chartData, chartRef, label, value) {
    const d = chartData.current;
    d.labels.push(label);
    d.datasets[0].data.push(value);
    if (d.labels.length > MAX_PTS) { d.labels.shift(); d.datasets[0].data.shift(); }
    chartRef.current?.update('none');
  }

  useEffect(() => {
    // 5. Sirf login user ke liye hi data fetch/socket chalu karein
    if (!user) return;

    fetch(`${BACKEND}/api/dashboard?history=${MAX_PTS}`)
      .then(r => r.json())
      .then(snap => {
        const { history, latest, log, stats: s } = snap;
        tData.current = makeChartData('#ff5500', history.temperature.map(h => h.time), history.temperature.map(h => h.value));
        mData.current = makeChartData('#00ff88', history.motion.map(h => h.time), history.motion.map(h => h.value));
        lData.current = makeChartData('#0099ff', history.light.map(h => h.time), history.light.map(h => h.value));

        if (latest.temperature !== null) {
          const hot = latest.temperature > 35;
          setTempVal(`${latest.temperature}°C`);
          setTempTag({ cls: hot ? 'tag-orange' : 'tag-green', text: hot ? '⚠ HIGH' : '✓ NORMAL' });
        }
        if (latest.light !== null) {
          const bright = latest.light > 500;
          setLight(`${latest.light} lux`);
          setLightTag({ cls: bright ? 'tag-blue' : 'tag-white', text: bright ? '☀ BRIGHT' : '🌙 DIM' });
        }
        if (latest.motion !== null) {
          setMotion(latest.motion ? 'DETECTED' : 'CLEAR');
          setMotionTag({ cls: latest.motion ? 'tag-orange' : 'tag-green', text: latest.motion ? '⚡ GPIO22 HIGH' : 'GPIO22 LOW' });
        }
        if (log) setEventLog(log);
        if (s)   setStats(s);

        tRef.current?.update();
        mRef.current?.update();
        lRef.current?.update();
      })
      .catch(() => console.log('Dashboard snapshot fetch failed'));

    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socket.on('sensorData', ({ data, log }) => {
      if (pauseRef.current) return;
      const now = new Date().toLocaleTimeString();
      setCount(c => c + 1);
      setLast(now);

      if (data.temperature !== undefined) {
        const hot = data.temperature > 35;
        setTempVal(`${data.temperature}°C`);
        setTempTag({ cls: hot ? 'tag-orange' : 'tag-green', text: hot ? '⚠ HIGH' : '✓ NORMAL' });
        pushChart(tData, tRef, now, data.temperature);
      }
      if (data.motion !== undefined) {
        setMotion(data.motion ? 'DETECTED' : 'CLEAR');
        setMotionTag({ cls: data.motion ? 'tag-orange' : 'tag-green', text: data.motion ? '⚡ GPIO22 HIGH' : 'GPIO22 LOW' });
        pushChart(mData, mRef, now, data.motion ? 1 : 0);
      }
      if (data.light !== undefined) {
        const bright = data.light > 500;
        setLight(`${data.light} lux`);
        setLightTag({ cls: bright ? 'tag-blue' : 'tag-white', text: bright ? '☀ BRIGHT' : '🌙 DIM' });
        pushChart(lData, lRef, now, data.light);
      }
      if (log) setEventLog(log);
    });

    return () => socket.disconnect();
  }, [user]);

  async function toggleSim() {
    const r = await fetch(`${BACKEND}/api/admin/toggle`, { method: 'POST' });
    const d = await r.json();
    pauseRef.current = !d.running;
    setPaused(!d.running);
  }

  async function manualTick() {
    await fetch(`${BACKEND}/api/simulate`, { method: 'POST' });
  }

  // 6. Access Check UI
  if (loading || !user) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
        Verifying secure access...
      </div>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <div style={{ padding: '3rem 3rem 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '1.5rem' }}>
          <div>
            <div className="label label-orange" style={{ marginBottom: '0.5rem' }}>▸ Real-Time Monitoring</div>
            <h1 className="display display-lg">SENSOR DASHBOARD_</h1>
          </div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 1.25rem', borderLeft: '1px solid var(--border)', height: 40 }}>
              <div className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: paused ? 'var(--orange)' : 'var(--green)' }} />
              <span className="mono" style={{ fontSize: '0.75rem', color: paused ? 'var(--orange)' : 'var(--green)' }}>
                {paused ? 'PAUSED' : 'LIVE FEED'}
              </span>
            </div>
            <div style={{ padding: '0 1rem', borderLeft: '1px solid var(--border)', height: 40, display: 'flex', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                Speed: <span style={{ color: 'var(--orange)' }}>{stats.speedLabel?.toUpperCase() || 'NORMAL'}</span>
              </span>
            </div>
            <button onClick={toggleSim} className="btn-ghost" style={{ borderLeft: 'none', height: 40 }}>
              {paused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
            <button onClick={manualTick} className="btn-ghost" style={{ borderLeft: 'none', height: 40 }}>▶ STEP</button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'var(--border)', gap: '1px', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Temperature · GPIO17', val: tempVal,    tag: tempTag,    color: 'var(--orange)' },
          { label: 'Motion · GPIO22',       val: motionVal,  tag: motionTag                                         },
          { label: 'Light Intensity · GPIO24', val: lightVal, tag: lightTag, color: 'var(--blue)'  },
          { label: 'Update Count', val: String(count),
            extra: <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }} className="mono">Last: {lastUpdate}</div> },
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--bg)', padding: '1.75rem 2rem', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div className="label" style={{ marginBottom: '0.75rem' }}>{c.label}</div>
            <div className="stat-num" style={c.color ? { color: c.color } : {}}>{c.val}</div>
            {c.tag  && <div style={{ marginTop: '0.75rem' }}><span className={`tag ${c.tag.cls}`}>{c.tag.text}</span></div>}
            {c.extra}
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ padding: '2rem 3rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <div>
              <div className="label label-orange" style={{ marginBottom: 2 }}>Temperature Trend</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Live readings in °C · GPIO17 · DHT11</span>
            </div>
            <span className={`tag ${paused ? 'tag-white' : 'tag-orange'}`}>{paused ? 'PAUSED' : 'LIVE'}</span>
          </div>
          <Line ref={tRef} data={tData.current} options={chartOpts('#ff5500')} />
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="label label-orange" style={{ marginBottom: 2 }}>Motion Events</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Detected / Clear · GPIO22 · PIR</span>
          </div>
          <Line ref={mRef} data={mData.current} options={chartOpts('#00ff88')} />
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ padding: '1.25rem 3rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <div>
              <div className="label label-orange" style={{ marginBottom: 2 }}>Light Intensity</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Lux over time · GPIO24 · LDR</span>
            </div>
            <span className={`tag ${paused ? 'tag-white' : 'tag-orange'}`}>{paused ? 'PAUSED' : 'LIVE'}</span>
          </div>
          <Line ref={lRef} data={lData.current} options={chartOpts('#0099ff')} />
        </div>

        {/* Event Log */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <div>
              <div className="label label-orange" style={{ marginBottom: 2 }}>Event Log</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{eventLog.length} entries</span>
            </div>
            <button onClick={() => setEventLog([])} className="btn-ghost" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>CLR</button>
          </div>
          <div style={{ height: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {eventLog.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 8px', borderLeft: `2px solid ${e.level === 'alert' ? 'var(--red)' : 'var(--border2)'}` }}>
                <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{e.time}</span>
                <span style={{ fontSize: '0.75rem', color: e.level === 'alert' ? 'var(--orange)' : 'var(--text)' }}>{e.message}</span>
              </div>
            ))}
            {eventLog.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
                Waiting for live data…
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}