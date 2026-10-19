import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { entryDecision } from './entryRules';
import { useKeepsakeAudio } from './KeepsakeSound';
const MAX_PASSWORD_LENGTH = 8;
export function EntryGate({
  onUnlock
}) {
  const audio = useKeepsakeAudio();
  const [password, setPassword] = useState(''),
    [error, setError] = useState(false);
  const input = useRef(null);
  const ambientFrames = useRef([]);
  const empty = password.length === 0;
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let stop = () => {};
    const start = () => {
      stop();
      const running = ambientFrames.current.map((layer, i) => {
        if (reduced.matches) {
          layer.style.transform = 'none';
          return null;
        }
        const resting = getComputedStyle(layer).transform;
        const frames = empty ? [{
          transform: resting
        }, {
          transform: i === 0 ? 'translate3d(-4px,7px,0) rotate(-1.5deg)' : 'translate3d(4px,-8px,0) rotate(2deg)'
        }, {
          transform: resting
        }] : [{
          transform: resting
        }, {
          transform: 'none'
        }];
        const animation = layer.animate(frames, {
          duration: empty ? i === 0 ? 6200 : 5400 : 450,
          iterations: empty ? Infinity : 1,
          easing: 'ease-in-out',
          fill: 'forwards'
        });
        return {
          layer,
          animation
        };
      });
      stop = () => running.forEach(item => {
        if (!item) return;
        item.layer.style.transform = getComputedStyle(item.layer).transform;
        item.animation.cancel();
      });
    };
    start();
    reduced.addEventListener('change', start);
    return () => {
      stop();
      reduced.removeEventListener('change', start);
    };
  }, [empty]);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const submit = e => {
    e.preventDefault();
    const result = entryDecision(password);
    if (!result.granted) {
      setError(true);
      input.current?.focus();
      input.current?.select();
      return;
    }
    // Prime the shared context in the trusted submit gesture, including pasted passwords.
    audio.prepare();
    onUnlock(result.birthday);
  };
  return <main className={`entry-gate ${error ? 'entry-error' : ''}`} style={{
    '--entry-offset': (password.length - 4) / 4
  }}>
    <div className="entry-frames" aria-hidden="true"><span className="entry-frame-motion" ref={el => {
        ambientFrames.current[0] = el;
      }}><span className="entry-frame entry-frame-back" /></span><span className="entry-frame-motion" ref={el => {
        ambientFrames.current[1] = el;
      }}><span className="entry-frame entry-frame-front" /></span></div>
    <form className="entry-form" onSubmit={submit} noValidate>
      <span className="entry-paper-back" aria-hidden="true" />
      <span className="entry-paper-tab" aria-hidden="true" />
      <div className="entry-paper-front">
        <div className="entry-input-row">
          <input ref={input} id="album-password" aria-label="密码" type="password" inputMode="numeric" enterKeyHint="go" autoComplete="off" maxLength={MAX_PASSWORD_LENGTH} value={password} onChange={e => {
          const next = e.target.value.replace(/\D/g, '').slice(0, MAX_PASSWORD_LENGTH);
          const { inputType, data } = e.nativeEvent;
          const insertion = inputType ? inputType.startsWith('insert') : next.length > password.length;
          if (insertion && (/\d/.test(data || '') || (next !== password && next.length >= password.length))) audio.play('key');
          setPassword(next);
          setError(false);
        }} aria-invalid={error} aria-describedby="entry-feedback" />
          <button className="entry-submit" type="submit" aria-label="进入纪念册">
            <ArrowRight size={23} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <span id="entry-feedback" className="entry-sr-only" role="status">{error ? '密码不正确，请重新输入。' : ''}</span>
    </form>
  </main>;
}
