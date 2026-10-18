import { useEffect, useState } from 'react';

export function ReleaseMagic({ variant, onComplete }) {
  const rain = variant === 'rain';
  const [particles] = useState(() => Array.from({ length: rain ? 72 : 24 }, (_, i) => {
    const angle = (Math.random() - .5) * Math.PI;
    const distance = 55 + Math.random() * 115;
    return {
      symbol: Math.random() > .5 ? '♥' : '✦',
      left: `${Math.random() * 100}%`, x: `${Math.cos(angle) * distance}px`, y: `${Math.sin(angle) * distance}px`,
      drift: `${(Math.random() - .5) * 100}px`, size: `${rain ? 10 + Math.random() * 20 : 4 + Math.random() * 9}px`,
      duration: `${rain ? 3.5 + Math.random() * 1.4 : 1.3 + Math.random() * .7}s`,
      delay: `${Math.random() * (rain ? 1.2 : .2)}s`, spin: `${(Math.random() - .5) * 220}deg`,
      color: ['#e8b5b9', '#e5c873', '#c6b5de', '#edd5a4'][i % 4]
    };
  }));
  useEffect(() => {
    const timer = setTimeout(onComplete, rain ? 6400 : 2300);
    return () => clearTimeout(timer);
  }, [rain, onComplete]);
  return <div className={`release-magic release-${variant}`} aria-hidden="true">
    {!rain && <><span className="release-halo" /><span className="release-halo second" /></>}
    {particles.map((particle, i) => <span className="release-particle" key={i} style={{
      left: rain ? particle.left : undefined,
      '--release-x': particle.x, '--release-y': particle.y, '--release-drift': particle.drift,
      '--release-size': particle.size, '--release-duration': particle.duration,
      '--release-delay': particle.delay, '--release-spin': particle.spin, '--release-color': particle.color
    }}>{rain ? particle.symbol : ''}</span>)}
  </div>;
}
