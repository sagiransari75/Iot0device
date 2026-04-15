'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/',          label: 'Home'      },
  { href: '/simulator', label: 'Simulator' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sensors',   label: 'Sensors'   },
  { href: '/admin',     label: 'Admin'     },
];

export default function Navbar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, logout } = useAuth();
  const themeRef   = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeBtn(saved);
  }, []);

  function updateThemeBtn(theme) {
    if (!themeRef.current) return;
    themeRef.current.innerHTML = theme === 'dark'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeBtn(next);
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <div className="logo-dot" />
        IotSimX
      </Link>

      <div className="navbar-links">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link${pathname === href ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
        <button
          ref={themeRef}
          className="theme-btn"
          onClick={toggleTheme}
          title="Toggle theme"
          suppressHydrationWarning
        />

        {user ? (
          /* ── Logged-in: avatar + name + logout ── */
          <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 1rem', height: 56 }}>
              {/* Avatar bubble */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--orange)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.8rem',
                flexShrink: 0,
              }}>
                {user.avatar || user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="theme-btn"
              title="Sign out"
              style={{ gap: 6, width: 'auto', padding: '0 1rem', fontSize: '0.75rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, borderLeft: '1px solid var(--border)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        ) : (
          /* ── Not logged in: Login / Sign up buttons ── */
          <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border)' }}>
            <Link
              href="/login"
              className={`nav-link${pathname === '/login' ? ' active' : ''}`}
              style={{ borderRight: '1px solid var(--border)' }}
            >
              LOGIN
            </Link>
            <Link
              href="/signup"
              className="nav-link"
              style={{ background: 'var(--orange)', color: '#fff', fontWeight: 700 }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--orange2)'}
              onMouseOut={e  => e.currentTarget.style.background = 'var(--orange)'}
            >
              SIGN UP
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
