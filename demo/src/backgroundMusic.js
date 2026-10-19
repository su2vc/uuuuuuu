// Original 16-bar melody, 76 BPM. A small score replaces an audio download.
const beat = 60 / 76;
const duration = 64 * beat;
const harmony = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 62, 67]];
const melody = [
  [[0, 76], [1.5, 79], [3, 76]], [[.5, 74], [2, 71], [3.25, 67]],
  [[0, 72], [2, 76]], [[.5, 74], [2, 79], [3, 76]],
  [[0, 76], [1.5, 81], [2.5, 79]], [[.5, 76], [2, 74], [3, 72]],
  [[0, 69], [1.5, 72], [3, 76]], [[.5, 74], [2.5, 67]],
  [[0, 72], [1, 76], [2.5, 79]], [[.5, 76], [2, 72]],
  [[0, 69], [1.5, 72], [3, 74]], [[.5, 71], [2, 74], [3, 79]],
  [[0, 76], [2, 79], [3, 76]], [[.5, 72], [2, 69]],
  [[0, 72], [1.5, 76], [3, 74]], [[0, 71], [2, 67]]
];
const score = melody.flatMap((notes, bar) => {
  const chord = harmony[bar % harmony.length], offset = bar * 4;
  return [
    { at: offset, note: chord[0], length: 3.6, volume: .025 },
    ...[0, 1.5, 2.5].map((at, i) => ({ at: offset + at, note: chord[i + 1], length: 1.4, volume: .022 })),
    ...notes.map(([at, note]) => ({ at: offset + at, note, length: 1.2, volume: .045 }))
  ];
}).sort((a, b) => a.at - b.at);

export function createBackgroundMusic({ getContext, canPlay, onBlocked = () => {} }) {
  let enabled = true, entered = false, disposed = false, running = false;
  let context, master, timer, cleanup, generation = 0, position = 0, origin = 0, cursor = 0, cycle = 0;
  const voices = new Set();
  const clearVoices = () => {
    clearTimeout(cleanup);
    for (const source of voices) { try { source.stop(); } catch { /* Already ended. */ } }
    voices.clear();
  };
  const pause = (immediate = false) => {
    generation++;
    clearInterval(timer);
    if (running) position = Math.max(0, context.currentTime - origin) % duration;
    running = false;
    if (!master) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0, context.currentTime, immediate ? .001 : .035);
    clearTimeout(cleanup);
    if (immediate) clearVoices();
    else cleanup = setTimeout(clearVoices, 180);
  };
  const note = (event, when) => {
    const source = context.createOscillator(), gain = context.createGain();
    source.type = event.note < 55 ? 'sine' : 'triangle';
    source.frequency.value = 440 * 2 ** ((event.note - 69) / 12);
    const length = event.length * beat;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(event.volume, when + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, when + length);
    source.connect(gain).connect(master);
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); };
    source.start(when);
    source.stop(when + length + .02);
  };
  const tick = () => {
    if (!canPlay()) { pause(); return; }
    // Only schedule 200ms ahead; a hidden/blocked page never queues a backlog.
    const horizon = context.currentTime + .2;
    while (origin + cycle * duration + score[cursor].at * beat < horizon) {
      const event = score[cursor], when = origin + cycle * duration + event.at * beat;
      if (when >= context.currentTime) note(event, when);
      if (++cursor === score.length) { cursor = 0; cycle++; }
    }
  };
  const sync = () => {
    if (disposed) return;
    if (!enabled || !entered || !canPlay()) { pause(); return; }
    if (running) return;
    const current = ++generation;
    try {
      context = getContext();
      if (!context) { enabled = false; onBlocked(); return; }
      const start = () => {
        if (current !== generation || disposed || !enabled || !entered || !canPlay()) return;
        if (context.state !== 'running') { enabled = false; onBlocked(); return; }
        clearVoices();
        master ||= context.createGain();
        master.disconnect();
        master.connect(context.destination);
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setValueAtTime(0, context.currentTime);
        master.gain.linearRampToValueAtTime(.55, context.currentTime + .7);
        origin = context.currentTime + .04 - position;
        cycle = 0;
        cursor = score.findIndex(event => event.at * beat >= position);
        if (cursor < 0) { cursor = 0; cycle = 1; }
        running = true;
        tick();
        timer = setInterval(tick, 80);
      };
      // Always enqueue resume, including a fast return while suspend is pending.
      context.resume().then(start).catch(() => {
        if (current === generation && !disposed) { enabled = false; onBlocked(); }
      });
    } catch { enabled = false; onBlocked(); }
  };
  return {
    sync,
    pause,
    setEntered(value) { entered = value; sync(); },
    setEnabled(value) { enabled = value; sync(); },
    dispose() { disposed = true; pause(true); master?.disconnect(); }
  };
}
