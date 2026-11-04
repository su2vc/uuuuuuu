import { moveTimeline } from './wheelGesture.js';
const browserClock = {
  now: () => performance.now(),
  frame: callback => requestAnimationFrame(callback),
  cancelFrame: id => cancelAnimationFrame(id),
  timer: (callback, delay) => setTimeout(callback, delay),
  cancelTimer: id => clearTimeout(id)
};

// Own the visible position, so interrupting alignment resumes exactly where it is.
// No velocity integration, momentum simulation, or input suppression.
export function createTimelineMotion({
  initial,
  count,
  onFrame,
  onCommit,
  alignmentMs = 260,
  clock = browserClock
}) {
  let position = initial,
    phase = 'idle',
    direction = 0;
  let frame = null,
    timer = null,
    disposed = false;
  const publish = () => onFrame({
    position,
    phase,
    direction
  });
  const cancel = () => {
    if (frame !== null) clock.cancelFrame(frame);
    if (timer !== null) clock.cancelTimer(timer);
    frame = timer = null;
  };
  const finish = target => {
    position = target;
    phase = 'idle';
    direction = 0;
    publish();
    onCommit(target);
  };
  const travel = (index, clicked = false) => {
    if (disposed) return;
    cancel();
    const from = position,
      target = Math.max(0, Math.min(count - 1, index)),
      start = clock.now();
    if (alignmentMs === 0 || Math.abs(target - from) < .001) {
      finish(target);
      return;
    }
    const duration = clicked ? Math.min(650, 320 + Math.abs(target - from) * 45) : alignmentMs;
    phase = 'aligning';
    direction = Math.sign(target - from);
    publish();
    const tick = () => {
      frame = null;
      if (disposed) return;
      const progress = Math.min(1, (clock.now() - start) / duration);
      const eased = clicked ? progress * progress * (3 - 2 * progress) : 1 - (1 - progress) ** 3;
      position = from + (target - from) * eased;
      if (progress === 1) finish(target);else {
        publish();
        frame = clock.frame(tick);
      }
    };
    frame = clock.frame(tick);
  };
  const settle = () => travel(Math.round(position));
  return {
    move(delta, spacing, held = false) {
      if (disposed || !delta) return;
      const next = moveTimeline(position, delta, spacing, count);
      // Clamped wheel tails must not keep an already stationary endpoint busy.
      // Still let fresh input interrupt a click animation starting at that edge.
      if (next === position && phase !== 'aligning') return;
      if (phase === 'aligning') cancel();
      position = next;
      phase = 'scrolling';
      direction = Math.sign(delta);
      if (frame === null) frame = clock.frame(() => {
        frame = null;
        publish();
      });
      if (timer !== null) clock.cancelTimer(timer);
      timer = held ? null : clock.timer(settle, 150);
    },
    hold() {
      cancel();
    },
    settle,
    select(index) {
      travel(index, true);
    },
    jump(index, commit = true) {
      if (disposed) return;
      cancel();
      position = Math.max(0, Math.min(count - 1, index));
      phase = 'idle';
      direction = 0;
      publish();
      if (commit) onCommit(position);
    },
    dispose() {
      disposed = true;
      cancel();
    }
  };
}
