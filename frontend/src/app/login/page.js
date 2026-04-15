'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
export default function LoginPage() {
  const { login }  = useAuth();
  const router     = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const formRef = useRef(null);

  function fillDemo() {
    setEmail('demo@iotsimx.dev');
    setPassword('demo1234');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      // 1. Context ke login function ko sirf Email aur Password chahiye
      // Ye internally API call karega aur token save karega
      await login(email.toLowerCase().trim(), password);

      // 2. Agar login success hua, toh seedha redirect
      router.push('/'); 
      
    } catch (err) {
      console.error("Login Error:", err);
      // Agar backend 401 bhej raha hai (Invalid credentials), toh yahan dikhega
      const msg = err.response?.data?.error || err.message || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 56px)' }}>

      {/* ── Left — Form ── */}
      <div style={{ borderRight: '1px solid var(--border)', padding: '4rem 3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>

          {/* Label + heading */}
          <div className="label label-orange" style={{ marginBottom: '0.75rem' }}>▸ Welcome back</div>
          <h1 className="display display-md" style={{ marginBottom: '0.5rem' }}>SIGN IN_</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Access your IotSimX dashboard. Monitor your Raspberry Pi sensors in real-time.
          </p>

          {/* Demo hint */}
          <div
            onClick={fillDemo}
            style={{
              padding: '0.75rem 1rem', marginBottom: '2rem',
              background: 'var(--orange-bg)', border: '1px solid var(--orange-bd)',
              borderLeft: '3px solid var(--orange)',
              cursor: 'pointer', transition: '0.15s',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,85,0,0.12)'}
            onMouseOut={e  => e.currentTarget.style.background = 'var(--orange-bg)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--orange)' }}>Click to fill demo credentials</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                demo@iotsimx.dev · demo1234
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem', marginBottom: '1.5rem',
              background: 'rgba(255,51,85,0.06)', border: '1px solid rgba(255,51,85,0.25)',
              borderLeft: '3px solid var(--red)', fontSize: '0.82rem', color: 'var(--red)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              ✗ {error}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem', fontFamily: "'JetBrains Mono', monospace" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: 'var(--bg2)', border: '1px solid var(--border2)',
                  color: 'var(--text)', outline: 'none',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.boxShadow = '0 0 0 3px var(--orange-bd)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none'; }}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '0.75rem 3rem 0.75rem 1rem',
                    background: 'var(--bg2)', border: '1px solid var(--border2)',
                    color: 'var(--text)', outline: 'none',
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.boxShadow = '0 0 0 3px var(--orange-bd)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none'; }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
                >
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-orange"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: 50, fontSize: '0.9rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  SIGNING IN…
                </>
              ) : 'SIGN IN →'}
            </button>
          </form>

          <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>Create one →</Link>
          </p>
        </div>
      </div>

      {/* ── Right — IoT Visual ── */}
      <div style={{ padding: '4rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Corner marks */}
        <div style={{ position: 'absolute', top: 20, right: 20, width: 20, height: 20, borderTop: '2px solid var(--orange)', borderRight: '2px solid var(--orange)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: 20, width: 20, height: 20, borderBottom: '2px solid var(--orange)', borderLeft: '2px solid var(--orange)' }} />

        <div style={{ marginBottom: '2rem' }}>
          <div className="label label-orange" style={{ marginBottom: '0.75rem' }}>▸ Platform Features</div>
          <h2 className="display display-md" style={{ marginBottom: '1rem' }}>IOT SIMULATION<br />MADE SIMPLE_</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: 440 }}>
            Simulate Raspberry Pi GPIO connections, generate live sensor data, and visualize IoT data flows — all in your browser with no hardware needed.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          {[
            { icon: '🔌', title: 'GPIO Visualizer',   desc: 'Interactive 40-pin header with live HIGH/LOW states' },
            { icon: '📊', title: 'Live Dashboard',     desc: 'Chart.js graphs updating every 2 seconds via Socket.IO' },
            { icon: '🌡',  title: 'Sensor Simulation', desc: 'DHT11, PIR Motion, and LDR Light sensors in real-time' },
            { icon: '🔧', title: 'Admin Panel',        desc: 'Control speed, toggle sensors, export JSON logs' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'var(--bg)', padding: '1rem 1.25rem', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.15rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
