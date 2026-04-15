import Link from 'next/link';

export const metadata = {
  title: '404 — Page Not Found · IotSimX',
};

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', gap: '1.5rem', textAlign: 'center', padding: '4rem 2rem' }}>
      <div className="label label-orange">▸ Error 404</div>
      <h1 className="display display-xl" style={{ color: 'var(--orange)' }}>404_</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 400, lineHeight: 1.7 }}>
        The requested page was not found. It may have been moved or does not exist.
      </p>
      <div style={{ display: 'flex', gap: 0 }}>
        <Link href="/" className="btn-orange">GO HOME →</Link>
        <Link href="/simulator" className="btn-outline" style={{ borderLeft: 'none' }}>OPEN SIMULATOR</Link>
      </div>
    </div>
  );
}
