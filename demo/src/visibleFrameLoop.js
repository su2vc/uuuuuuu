const browserClock = {
  now: () => performance.now(),
  frame: callback => requestAnimationFrame(callback),
  cancel: id => cancelAnimationFrame(id)
};

// Keep animation time tied to visible time. Hidden tabs schedule no frames and
// resuming never skips the remaining opening sequence.
export function createVisibleFrameLoop(tick, {
  page = document,
  clock = browserClock
} = {}) {
  let frame = null;
  let last = clock.now();
  let elapsed = 0;
  let stopped = false;
  const schedule = () => {
    if (!stopped && !page.hidden && frame === null) frame = clock.frame(run);
  };
  const run = now => {
    frame = null;
    if (stopped || page.hidden) return;
    const delta = Math.max(0, now - last);
    elapsed += delta;
    last = now;
    if (tick({
      elapsed,
      delta
    }) === false) {
      dispose();
      return;
    }
    schedule();
  };
  const visibility = () => {
    if (frame !== null) clock.cancel(frame);
    frame = null;
    last = clock.now();
    schedule();
  };
  function dispose() {
    stopped = true;
    if (frame !== null) clock.cancel(frame);
    frame = null;
    page.removeEventListener('visibilitychange', visibility);
  }
  page.addEventListener('visibilitychange', visibility);
  schedule();
  return {
    get elapsed() {
      return elapsed;
    },
    dispose
  };
}
