// Small original effects, synthesized only after a user gesture. No audio download.
export function createKeepsakeAudio({
  createContext = () => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    return Audio ? new Audio() : null;
  },
  canPlay = () => !document.hidden,
  now = () => performance.now()
} = {}) {
  let context = null, disposed = false, sequence = 0;
  const voices = new Set();
  const getContext = () => {
    if (disposed) return null;
    try { return context ||= createContext(); }
    catch { return null; }
  };
  const stop = () => {
    sequence++;
    for (const voice of voices) {
      try { voice.stop(); } catch { /* A finished voice can already be stopped. */ }
    }
    voices.clear();
  };
  const prepare = () => {
    if (disposed || !canPlay()) return;
    try {
      getContext();
      if (context?.state === 'suspended') return context.resume().catch(() => {});
    } catch { /* Audio support or permission must never block an interaction. */ }
  };
  const voice = (source, gain, end, filter) => {
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      gain.disconnect();
      filter?.disconnect();
    };
    source.stop(end);
  };
  const tone = (frequency, start, duration, volume) => {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    voice(oscillator, gain, start + duration + .02);
  };
  const puff = (start, volume) => {
    const source = context.createBufferSource(), gain = context.createGain(), filter = context.createBiquadFilter();
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .1), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = .7;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .1);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start);
    voice(source, gain, start + .12, filter);
  };
  return {
    prepare,
    getContext,
    stop,
    startCharge(duration = 2000) {
      if (disposed || !canPlay()) return;
      stop();
      const current = sequence, began = now(), ready = prepare();
      const play = () => {
        if (current !== sequence || disposed || !canPlay() || context?.state !== 'running') return;
        const elapsed = now() - began;
        // Delay the first pulse so ordinary taps retain their short confetti sound.
        for (let offset = 120; offset < duration; offset += 220 - 120 * offset / duration) {
          if (offset < elapsed) continue;
          const progress = offset / duration;
          tone(260 * 2 ** (progress * 1.8), context.currentTime + (offset - elapsed) / 1000, .075, .02);
        }
      };
      if (context?.state === 'running') play();
      else ready?.then(play);
    },
    play(effect, strength = 1) {
      if (disposed || !canPlay()) return;
      // A new burst replaces the previous one, so rapid tapping cannot pile up noise.
      stop();
      const current = sequence, ready = prepare();
      const play = () => {
        if (current !== sequence || disposed || !canPlay() || context?.state !== 'running') return;
        const start = context.currentTime + .005;
        if (effect === 'confetti') {
          const level = Math.max(0, Math.min(1, strength));
          puff(start, .035 + level * .025);
          tone(660 + level * 220, start, .16, .025);
          if (level === 1) [1046.5, 1318.5, 1568].forEach((frequency, i) => tone(frequency, start + .045 + i * .07, .3, .025));
        } else {
          const notes = effect === 'rain' ? [1318.5, 1568, 2093, 1760, 1568, 1318.5] : [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((frequency, i) => tone(frequency, start + i * .085, .45, .027));
        }
      };
      if (context?.state === 'running') play();
      else ready?.then(play);
    },
    suspend() {
      stop();
      if (context?.state === 'running') context.suspend().catch(() => {});
    },
    dispose() {
      disposed = true;
      stop();
      context?.close().catch(() => {});
      context = null;
    }
  };
}
