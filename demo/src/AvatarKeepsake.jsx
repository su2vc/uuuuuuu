import { useCallback, useEffect, useRef, useState } from 'react';
import { asset, imageCrossOrigin } from './assets';

const colors = ['#edaa48', '#e7c84c', '#ae91d1', '#e9909f', '#82bcb1', '#f5df9a'];
const HOLD_MS = 5000;

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
  const [party, setParty] = useState({ step: 0, sequence: 0, messageSequence: 0, messageIndex: -1, visible: false, bursts: [] });
  const [hold, setHold] = useState(null);
  const shake = useRef(null);
  const press = useRef(null), suppressClick = useRef(false);
  const removeBurst = useCallback(id => setParty(previous => ({ ...previous, bursts: previous.bursts.filter(burst => burst.id !== id) })), []);
  const cancelHold = useCallback(() => {
    if (!press.current) return;
    clearTimeout(press.current.timer);
    press.current = null;
    suppressClick.current = true;
    setHold(null);
  }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) cancelHold(); };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('blur', cancelHold);
    return () => {
      clearTimeout(press.current?.timer);
      shake.current?.cancel();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('blur', cancelHold);
    };
  }, [cancelHold]);
  useEffect(() => {
    if (!party.visible) return;
    const timer = setTimeout(() => setParty(previous => ({ ...previous, visible: false })), 4000);
    return () => clearTimeout(timer);
  }, [party.visible, party.messageSequence]);
  const celebrate = button => {
    shake.current?.cancel();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shake.current = button.animate([
        { transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-13deg) scale(1.08)' },
        { transform: 'rotate(11deg) scale(1.08)' }, { transform: 'rotate(-7deg) scale(1.04)' },
        { transform: 'rotate(0) scale(1)' }
      ], { duration: 360, easing: 'ease-out' });
    }
    setParty(previous => {
      const step = previous.step % 10 + 1;
      const sequence = previous.sequence + 1;
      return {
        ...previous, step, sequence, visible: false,
        bursts: [...previous.bursts.slice(-3), { id: sequence, step }]
      };
    });
  };
  const beginHold = (button, gesture) => {
    if (press.current) return;
    shake.current?.cancel();
    suppressClick.current = false;
    const current = { ...gesture, start: performance.now(), avatarIndex: Number(button.dataset.avatarIndex) };
    press.current = current;
    setParty(previous => previous.visible ? { ...previous, visible: false } : previous);
    setHold({ avatarIndex: current.avatarIndex, phase: 'holding' });
    current.timer = setTimeout(() => {
      if (press.current === current) setHold({ avatarIndex: current.avatarIndex, phase: 'ready' });
    }, HOLD_MS);
  };
  const finishHold = button => {
    const current = press.current;
    if (!current) return;
    const ready = performance.now() - current.start >= HOLD_MS;
    clearTimeout(current.timer);
    press.current = null;
    setHold(null);
    if (ready) {
      suppressClick.current = current.kind === 'pointer';
      setParty(previous => ({
        ...previous, visible: true, messageSequence: previous.messageSequence + 1,
        messageIndex: (previous.messageIndex + 1) % messages.length
      }));
    } else if (current.kind === 'keyboard') celebrate(button);
  };
  return <div className="avatars" data-celebration-step={party.step}>
    {avatars.map((avatar, i) => messages.length ? <button className={`avatar avatar-button ${hold?.avatarIndex === i ? `is-holding ${hold.phase === 'ready' ? 'is-ready' : ''}` : ''}`} key={i} data-avatar-index={i} aria-label={`${avatar.alt}，小彩蛋`} aria-description="点击庆祝，长按五秒后松开查看留言" onClick={event => {
      if (suppressClick.current && event.detail > 0) { suppressClick.current = false; return; }
      celebrate(event.currentTarget);
    }} onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0) return;
      beginHold(event.currentTarget, { kind: 'pointer', pointerId: event.pointerId, x: event.clientX, y: event.clientY });
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const current = press.current;
      if (current?.kind === 'pointer' && current.pointerId === event.pointerId && Math.hypot(event.clientX - current.x, event.clientY - current.y) > 20) cancelHold();
    }} onPointerUp={event => {
      if (press.current?.pointerId === event.pointerId) finishHold(event.currentTarget);
    }} onPointerCancel={cancelHold} onLostPointerCapture={cancelHold} onBlur={cancelHold} onContextMenu={event => event.preventDefault()} onKeyDown={event => {
      if (event.key === 'Escape') { cancelHold(); return; }
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) beginHold(event.currentTarget, { kind: 'keyboard', key: event.key });
    }} onKeyUp={event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (press.current?.kind === 'keyboard' && press.current.key === event.key) finishHold(event.currentTarget);
    }}>
      <img crossOrigin={imageCrossOrigin(avatar.src)} src={asset(avatar.src)} alt="" draggable="false" />
      {hold?.avatarIndex === i && <svg className="avatar-charge-ring" viewBox="0 0 64 64" aria-hidden="true"><circle className="avatar-charge-track" cx="32" cy="32" r="29" /><circle className="avatar-charge-progress" cx="32" cy="32" r="29" pathLength="1" /></svg>}
    </button> : <div className="avatar" key={i}><img crossOrigin={imageCrossOrigin(avatar.src)} src={asset(avatar.src)} alt={avatar.alt} /></div>)}
    {party.bursts.map(burst => <AvatarBurst key={burst.id} {...burst} onComplete={removeBurst} />)}
    <div className={`avatar-message ${party.visible ? 'is-visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">
      {party.visible && <span key={party.messageSequence}>{messages[party.messageIndex]}</span>}
    </div>
  </div>;
}
