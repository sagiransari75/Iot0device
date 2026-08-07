'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios'; // 1. Axios import zaroori hai

function PasswordStrength({ password }) {
  const checks = [
    { label: 'Min 6 characters', ok: password.length >= 6 },
    { label: 'Uppercase letter',  ok: /[A-Z]/.test(password) },
    { label: 'Number',            ok: /[0-9]/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['var(--red)', 'var(--red)', 'var(--orange)', 'var(--orange)', 'var(--green)'];
  const labels = ['', 'Weak', 'Weak', 'Fair', 'Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: '0.6rem' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: '0.5rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, background: i < score ? colors[score] : 'var(--border2)', transition: '0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {checks.map((c, i) => (
            <span key={i} style={{ fontSize: '0.68rem', color: c.ok ? 'var(--green)' : 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span style={{ fontSize: '0.72rem', color: colors[score], fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{labels[score]}</span>}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const { login } = useAuth(); // Auth context se login le rahe hain
  const router     = useRouter();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [agreed,   setAgreed]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done,     setDone]     = useState(false);

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'var(--bg2)', border: '1px solid var(--border2)',
    color: 'var(--text)', outline: 'none',
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const onFocus = e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.boxShadow = '0 0 0 3px var(--orange-bd)'; };
  const onBlur  = e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none'; };
  const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem', fontFamily: "'JetBrains Mono', monospace" };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // --- Validations (Same as before) ---
    if (!name.trim())          { setError('Please enter your full name.'); return; }
    if (!email)                { setError('Please enter your email.'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    if (!agreed)               { setError('Please accept the terms to continue.'); return; }

    setLoading(true);

    try {
      // --- Fix 1: Direct Backend Call ---
      // Agar env load nahi ho raha toh localhost:4000 use karega
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        name: name.trim(),
        email: email.toLowerCase(),
        password: password
      });

      const { success, token, user } = response.data;

      if (success) {
        // --- Fix 2: Token Store & State Update ---
        localStorage.setItem('iot_token', token);
        
        // Context update (login credentials wala call yahan nahi karna)
        if (login) {
          // Dashboard redirect
          setDone(true);
          setTimeout(() => router.push('/'), 1500); 
        }
      }
    } catch (err) {
      // Backend error handle
      const msg = err.response?.data?.error || 'Signup failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // 2. "Success" UI ko return se theek pehle rakhein
  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>✓</div>
        <h2 className="display display-md" style={{ color: 'var(--green)' }}>ACCOUNT CREATED_</h2>
        <p style={{ color: 'var(--muted)' }}>Redirecting you to the dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 56px)' }}>
      {/* --- Left Visual --- */}
      <div style={{ borderRight: '1px solid var(--border)', padding: '4rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'var(--bg2)' }}>
        <div style={{ position: 'absolute', top: 20, left: 20, width: 20, height: 20, borderTop: '2px solid var(--orange)', borderLeft: '2px solid var(--orange)' }} />
        <div style={{ position: 'absolute', bottom: 20, right: 20, width: 20, height: 20, borderBottom: '2px solid var(--orange)', borderRight: '2px solid var(--orange)' }} />
        <div className="label label-orange" style={{ marginBottom: '0.75rem' }}>▸ Why IotSimX?</div>
        <h2 className="display display-md" style={{ marginBottom: '1.5rem' }}>LEARN IOT<br />WITHOUT RISK_</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', marginBottom: '2rem' }}>
          {[{ val: '18.8B', label: 'IoT devices globally', orange: true }, { val: '0', label: 'Hardware required' }, { val: '3', label: 'Sensors simulated', orange: true }, { val: '100%', label: 'Browser-based' }].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg)', padding: '1.25rem 1.5rem' }}>
              <div className="stat-num" style={{ fontSize: '2rem', color: s.orange ? 'var(--orange)' : 'var(--text)' }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Right Form --- */}
      <div style={{ padding: '4rem 3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div className="label label-orange" style={{ marginBottom: '0.75rem' }}>▸ Get started for free</div>
          <h1 className="display display-md" style={{ marginBottom: '0.5rem' }}>CREATE ACCOUNT_</h1>
          {error && <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', background: 'rgba(255,51,85,0.06)', border: '1px solid rgba(255,51,85,0.25)', borderLeft: '3px solid var(--red)', fontSize: '0.82rem', color: 'var(--red)', fontFamily: "'JetBrains Mono', monospace" }}>✗ {error}</div>}
          
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Sagir Ansari" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: '3rem' }} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, borderColor: confirm && confirm !== password ? 'var(--red)' : 'var(--border2)' }} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <label style={{ display: 'flex', gap: 10, cursor: 'pointer', marginBottom: '1.75rem' }}>
              <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} />
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>I agree to the Terms & Privacy</span>
            </label>
            <button type="submit" className="btn-orange" disabled={loading} style={{ width: '100%', height: 50 }}>
              {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}