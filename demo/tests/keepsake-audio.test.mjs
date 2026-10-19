import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeepsakeAudio } from '../src/keepsakeAudio.js';

function fixture(deferResume = false) {
  const counts = { contexts: 0, starts: 0, resumes: 0, suspends: 0, closes: 0 };
  let allowed = true;
  const pending = [];
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({
    gain: param(), frequency: param(), Q: param(),
    connect() { return this; }, disconnect() {},
    start() { counts.starts++; }, stop() {}
  });
  const context = {
    state: 'suspended', currentTime: 0, sampleRate: 100,
    resume() {
      counts.resumes++;
      if (deferResume) return new Promise(resolve => pending.push(() => { this.state = 'running'; resolve(); }));
      this.state = 'running'; return Promise.resolve();
    },
    suspend() { counts.suspends++; this.state = 'suspended'; return Promise.resolve(); },
    close() { counts.closes++; this.state = 'closed'; return Promise.resolve(); },
    createOscillator: node, createGain: node, createBufferSource: node, createBiquadFilter: node,
    createBuffer: (_, length) => ({ getChannelData: () => new Float32Array(length) })
  };
  const audio = createKeepsakeAudio({ createContext: () => { counts.contexts++; return context; }, canPlay: () => allowed });
  return { audio, counts, resume: () => pending.shift()?.(), setAllowed: value => allowed = value };
}

test('音效在用户操作前不创建音频上下文，静音期间不发声', () => {
  const { audio, counts } = fixture();
  assert.equal(counts.contexts, 0);
  audio.setMuted(true); audio.prepare(); audio.play('rain');
  assert.equal(counts.contexts, 0);
  audio.setMuted(false); audio.prepare(); audio.play('rain');
  assert.equal(counts.contexts, 1);
  assert.equal(counts.starts, 6);
  audio.setMuted(true); audio.play('glow');
  assert.equal(counts.starts, 6);
  audio.dispose();
});

test('后台或视频播放时不启动音效，恢复操作后可以继续，卸载永久释放', () => {
  const { audio, counts, setAllowed } = fixture();
  setAllowed(false); audio.prepare(); audio.play('confetti');
  assert.equal(counts.contexts, 0);
  setAllowed(true); audio.prepare(); audio.play('confetti', .1);
  assert.equal(counts.starts, 2);
  audio.suspend(); setAllowed(false); audio.play('glow');
  assert.equal(counts.starts, 2);
  assert.equal(counts.suspends, 1);
  setAllowed(true); audio.prepare(); audio.play('glow');
  assert.equal(counts.starts, 6);
  audio.dispose(); audio.prepare(); audio.play('rain');
  assert.equal(counts.starts, 6);
  assert.equal(counts.closes, 1);
});

test('不支持或拒绝音频时，彩蛋交互仍可使用', () => {
  for (const createContext of [() => null, () => { throw new Error('Audio unavailable'); }]) {
    const audio = createKeepsakeAudio({ createContext, canPlay: () => true });
    assert.doesNotThrow(() => { audio.prepare(); audio.play('rain'); audio.suspend(); audio.dispose(); });
  }
});

test('等待浏览器恢复音频后发声，等待期间静音或离开不会迟到发声', async () => {
  const first = fixture(true);
  first.audio.play('rain');
  assert.equal(first.counts.starts, 0);
  first.resume(); await new Promise(setImmediate);
  assert.equal(first.counts.starts, 6);
  first.audio.dispose();
  for (const action of ['mute', 'dispose', 'video']) {
    const current = fixture(true);
    current.audio.play('rain');
    if (action === 'mute') current.audio.setMuted(true);
    if (action === 'dispose') current.audio.dispose();
    if (action === 'video') current.setAllowed(false);
    current.resume(); await new Promise(setImmediate);
    assert.equal(current.counts.starts, 0);
    current.audio.dispose();
  }
});
