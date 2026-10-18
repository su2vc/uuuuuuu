import { useCallback, useEffect, useRef, useState } from 'react';
import { asset, imageCrossOrigin } from './assets';

const colors = ['#edaa48', '#e7c84c', '#ae91d1', '#e9909f', '#82bcb1', '#f5df9a'];

function AvatarBurst({ id, step, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(id), 2200);
    return () => clearTimeout(timer);
  }, [id, onComplete]);
  const finale = step === 10;
  const count = finale ? 72 : 4 + step * 4;
  return <span className={`avatar-burst ${finale ? 'is-finale' : ''}`} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => {
      const spread = (finale ? 310 : 65 + step * 20);
      const fraction = ((i * 37 + id * 13) % 101) / 100;
      return <span key={i} className={`avatar-confetti ${i % 4 === 0 ? 'is-ribbon' : ''}`} style={{
        '--confetti-x': `${-22 + fraction * spread}px`,
        '--confetti-y': `${-45 + ((i * 29 + id * 7) % 101) * (finale ? 1.4 : .8)}px`,
        '--confetti-fall': `${100 + (i * 17 % 130)}px`,
        '--confetti-spin': `${(i % 2 ? -1 : 1) * (180 + i * 53 % 540)}deg`,
        '--confetti-color': colors[i % colors.length],
        '--confetti-duration': `${1200 + i % 7 * 120}ms`,
        '--confetti-delay': `${i % 5 * 22}ms`
      }} />;
    })}
    {finale && ['🍊', '🎂', '🍊', '🎂'].map((emoji, i) => <span className="avatar-confetti avatar-confetti-emoji" key={`emoji-${i}`} style={{
      '--confetti-x': `${40 + i * 66}px`, '--confetti-y': `${18 + i % 2 * 42}px`,
      '--confetti-fall': '145px', '--confetti-spin': `${i % 2 ? 35 : -35}deg`,
      '--confetti-duration': '1900ms', '--confetti-delay': `${i * 55}ms`
    }}>{emoji}</span>)}
  </span>;
}

export function AvatarKeepsake({ avatars, messages }) {
  const [party, setParty] = useState({ step: 0, sequence: 0, messageIndex: -1, visible: false, bursts: [] });
  const shake = useRef(null);
  const removeBurst = useCallback(id => setParty(previous => ({ ...previous, bursts: previous.bursts.filter(burst => burst.id !== id) })), []);
  useEffect(() => () => shake.current?.cancel(), []);
  useEffect(() => {
    if (!party.visible) return;
    const timer = setTimeout(() => setParty(previous => ({ ...previous, visible: false })), 4000);
    return () => clearTimeout(timer);
  }, [party.visible, party.sequence]);
  const celebrate = event => {
    shake.current?.cancel();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shake.current = event.currentTarget.animate([
        { transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-13deg) scale(1.08)' },
        { transform: 'rotate(11deg) scale(1.08)' }, { transform: 'rotate(-7deg) scale(1.04)' },
        { transform: 'rotate(0) scale(1)' }
      ], { duration: 360, easing: 'ease-out' });
    }
    setParty(previous => {
      const step = previous.step % 10 + 1;
      const sequence = previous.sequence + 1;
      return {
        step, sequence, visible: step === 10,
        messageIndex: step === 10 ? (previous.messageIndex + 1) % messages.length : previous.messageIndex,
        bursts: [...previous.bursts.slice(-3), { id: sequence, step }]
      };
    });
  };
  return <div className="avatars" data-celebration-step={party.step}>
    {avatars.map((avatar, i) => messages.length ? <button className="avatar avatar-button" key={i} aria-label={`${avatar.alt}，小彩蛋`} onClick={celebrate}>
      <img crossOrigin={imageCrossOrigin(avatar.src)} src={asset(avatar.src)} alt="" />
    </button> : <div className="avatar" key={i}><img crossOrigin={imageCrossOrigin(avatar.src)} src={asset(avatar.src)} alt={avatar.alt} /></div>)}
    {party.bursts.map(burst => <AvatarBurst key={burst.id} {...burst} onComplete={removeBurst} />)}
    <div className={`avatar-message ${party.visible ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">
      {party.visible && <span key={party.sequence}>{messages[party.messageIndex]}</span>}
    </div>
  </div>;
}
