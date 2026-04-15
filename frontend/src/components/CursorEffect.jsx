'use client';
import { useEffect, useRef } from 'react';

export default function CursorEffect() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    let mx = 0, my = 0, rx = 0, ry = 0, animId;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left  = mx + 'px';
      dot.style.top   = my + 'px';
      glow.style.left = mx + 'px';
      glow.style.top  = my + 'px';
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      animId = requestAnimationFrame(animateRing);
    };
    animId = requestAnimationFrame(animateRing);

    const grow = () => {
      ring.style.width  = '52px'; ring.style.height = '52px';
      ring.style.borderColor = 'var(--orange)';
      dot.style.width = '4px'; dot.style.height = '4px';
    };
    const shrink = () => {
      ring.style.width  = '36px'; ring.style.height = '36px';
      ring.style.borderColor = 'rgba(255,85,0,.5)';
      dot.style.width = '8px'; dot.style.height = '8px';
    };

    document.querySelectorAll('a, button, input, label, .btn-orange, .btn-outline, .btn-ghost')
      .forEach(el => { el.addEventListener('mouseenter', grow); el.addEventListener('mouseleave', shrink); });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div id="cursor-glow" ref={glowRef} />
      <div id="cursor-ring" ref={ringRef} />
      <div id="cursor-dot"  ref={dotRef}  />
    </>
  );
}
