import { useEffect, useRef } from 'react';
const BIRTHDAY_DURATION_MS = 3000;
const colors = ['#b6a2db', '#e6c83f', '#e9dda1', '#8b78aa', '#adc7b5', '#faf7ef'];
const confetti = Array.from({
  length: 42
}, (_, i) => {
  const direction = i % 2 === 0 ? -1 : 1;
  return {
    x: direction * (65 + i * 47 % 360),
    y: -80 - i * 53 % 260,
    fall: 140 + i * 31 % 260,
    spin: direction * (90 + i * 67 % 570),
    delay: i % 7 * .045,
    color: colors[i % colors.length]
  };
});
export function BirthdayCelebration({
  onComplete
}) {
  const screen = useRef(null),
    finish = useRef(onComplete);
  finish.current = onComplete;
  useEffect(() => {
    screen.current?.focus();
    const timer = setTimeout(() => finish.current(), BIRTHDAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);
  return <div ref={screen} className="birthday-celebration" style={{
    '--birthday-exit-delay': `${BIRTHDAY_DURATION_MS - 500}ms`,
    '--birthday-paper-duration': `${BIRTHDAY_DURATION_MS - 800}ms`
  }} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="birthday-title" onKeyDown={e => {
    if (e.key === 'Escape') finish.current();
    if (e.key === 'Tab') {
      e.preventDefault();
      screen.current?.focus();
    }
  }}>
    <div className="birthday-papers" aria-hidden="true">{confetti.map((p, i) => <span key={i} className={`birthday-paper ${i % 7 === 0 ? 'birthday-ribbon' : ''}`} style={{
        '--x': `${p.x}px`,
        '--y': `${p.y}px`,
        '--fall': `${p.fall}px`,
        '--spin': `${p.spin}deg`,
        '--delay': `${p.delay}s`,
        '--paper-color': p.color
      }} />)}</div>
    <div className="birthday-message">
      <span className="birthday-date">10.20</span>
      <span className="birthday-popper" aria-hidden="true">🎉</span>
      <h2 id="birthday-title">生日快乐uu</h2>
    </div>
  </div>;
}
