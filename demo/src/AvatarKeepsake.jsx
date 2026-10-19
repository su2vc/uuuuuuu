import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useSqueezePress } from './useSqueezePress';
import { ReleaseMagic } from './ReleaseMagic';
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

export function AvatarKeepsake({ avatars, message }) {
  const [party, setParty] = useState({ step: 0, sequence: 0, bursts: [] });
  const [release, setRelease] = useState(0), [releaseVisible, setReleaseVisible] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const shake = useRef(null), noteSeen = useRef(false), avatarButton = useRef(null), closeButton = useRef(null);
  const removeBurst = useCallback(id => setParty(previous => ({ ...previous, bursts: previous.bursts.filter(burst => burst.id !== id) })), []);
  const endRelease = useCallback(() => setReleaseVisible(false), []);
  useEffect(() => () => shake.current?.cancel(), []);
  useEffect(() => { if (noteOpen) closeButton.current?.focus({ preventScroll: true }); }, [noteOpen]);
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
      return { step, sequence, bursts: [...previous.bursts.slice(-3), { id: sequence, step }] };
    });
  };
  const squeeze = useSqueezePress({
    disabled: noteOpen,
    onTap: celebrate,
    onStart: () => shake.current?.cancel(),
    onRelease: () => {
      setRelease(value => value + 1);
      setReleaseVisible(true);
      if (message && !noteSeen.current) {
        noteSeen.current = true;
        setNoteOpen(true);
      }
    }
  });
  const closeNote = () => {
    setNoteOpen(false);
    requestAnimationFrame(() => avatarButton.current?.focus({ preventScroll: true }));
  };
  return <div className={`avatars ${noteOpen ? 'has-note' : ''}`} data-celebration-step={party.step}>
    {avatars.map((avatar, i) => <button ref={i === 0 ? avatarButton : undefined} className="avatar avatar-button" key={i} disabled={noteOpen} aria-label={`${avatar.alt}，小彩蛋`} aria-description="点击庆祝，长按 2 秒后松开有惊喜" {...squeeze.bindings}>
      <img crossOrigin={imageCrossOrigin(avatar.src)} src={asset(avatar.src)} alt="" draggable="false" />
    </button>)}
    {party.bursts.map(burst => <AvatarBurst key={burst.id} {...burst} onComplete={removeBurst} />)}
    {releaseVisible && <ReleaseMagic key={release} variant="glow" onComplete={endRelease} />}
    {noteOpen && <div className="avatar-note" role="dialog" aria-label="给你的话" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closeNote(); } }}>
      <button ref={closeButton} className="avatar-note-close" aria-label="关闭留言" onClick={closeNote}><X size={18} /></button>
      <p>{message}</p>
    </div>}
  </div>;
}
