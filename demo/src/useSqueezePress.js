import { useCallback, useEffect, useRef, useState } from 'react';

const HOLD_MS = 2000;

// Both keepsakes use one gesture: squeeze to a fixed size, then release.
// Only gesture boundaries update React; the browser animates the transforms.
export function useSqueezePress({ onTap, onRelease, onStart, disabled = false }) {
  const latest = useRef(null);
  latest.current = { onTap, onRelease, onStart, disabled };
  const press = useRef(null), animation = useRef(null);
  const [phase, setPhase] = useState('idle');
  const restore = useCallback((button, ready = false) => {
    const transform = getComputedStyle(button).transform;
    animation.current?.cancel();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animation.current = button.animate(ready ? [
      { transform }, { transform: 'scale(1.16) rotate(3deg)', offset: .65 }, { transform: 'scale(1)' }
    ] : [{ transform }, { transform: 'scale(1)' }], { duration: ready ? 480 : 180, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }, []);
  const cancel = useCallback(() => {
    const current = press.current;
    if (!current) return;
    clearTimeout(current.timer);
    press.current = null;
    restore(current.button);
    setPhase('idle');
  }, [restore]);
  useEffect(() => {
    const hide = () => { if (document.hidden) cancel(); };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('blur', cancel);
    return () => {
      clearTimeout(press.current?.timer);
      animation.current?.cancel();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('blur', cancel);
    };
  }, [cancel]);
  useEffect(() => { if (disabled) cancel(); }, [disabled, cancel]);
  const begin = (button, gesture) => {
    if (latest.current.disabled || press.current) return;
    latest.current.onStart?.();
    animation.current?.cancel();
    const current = { ...gesture, button, start: performance.now() };
    press.current = current;
    setPhase('holding');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animation.current = button.animate([{ transform: 'scale(1)' }, { transform: 'scale(.7) rotate(-4deg)' }], {
        duration: HOLD_MS, easing: 'ease-out', fill: 'forwards'
      });
    }
    current.timer = setTimeout(() => { if (press.current === current) setPhase('ready'); }, HOLD_MS);
  };
  const finish = () => {
    const current = press.current;
    if (!current) return;
    const ready = performance.now() - current.start >= HOLD_MS;
    clearTimeout(current.timer);
    press.current = null;
    setPhase('idle');
    if (ready) {
      restore(current.button, true);
      latest.current.onRelease?.();
    } else {
      if (latest.current.onTap) animation.current?.cancel();
      else restore(current.button);
      latest.current.onTap?.(current.button);
    }
  };
  return {
    phase,
    bindings: {
      'data-hold-state': phase,
      onClick: event => {
        // Pointer and keyboard releases are handled above. A screen reader can
        // still invoke a plain click without manufacturing a pointer gesture.
        if (!latest.current.disabled && event.detail === 0) latest.current.onTap?.(event.currentTarget);
      },
      onPointerDown: event => {
        if (!event.isPrimary || event.button !== 0 || latest.current.disabled) return;
        begin(event.currentTarget, { kind: 'pointer', pointerId: event.pointerId, x: event.clientX, y: event.clientY });
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: event => {
        const current = press.current;
        if (current?.kind === 'pointer' && current.pointerId === event.pointerId && Math.hypot(event.clientX - current.x, event.clientY - current.y) > 20) cancel();
      },
      onPointerUp: event => { if (press.current?.pointerId === event.pointerId) finish(); },
      onPointerCancel: cancel, onLostPointerCapture: cancel, onBlur: cancel,
      onContextMenu: event => event.preventDefault(),
      onKeyDown: event => {
        if (event.key === 'Escape') { cancel(); return; }
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        if (!event.repeat) begin(event.currentTarget, { kind: 'keyboard', key: event.key });
      },
      onKeyUp: event => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        if (press.current?.kind === 'keyboard' && press.current.key === event.key) finish();
      }
    }
  };
}
