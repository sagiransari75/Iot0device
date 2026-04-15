export default function Footer() {
  return (
    <footer>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.9rem' }}>
        IotSimX
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
        Built by <span style={{ color: 'var(--orange)' }}>Shubham Sharma</span> · IotSimX · Academic Year 2026
      </div>
      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted2)' }}>v1.0.0</div>
    </footer>
  );
}
