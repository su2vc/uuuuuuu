import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeepsakeAudio } from '../src/keepsakeAudio.js';

function fixture(deferResume = false) {
  const counts = { contexts: 0, starts: 0, resumes: 0, suspends: 0, closes: 0, cancels: 0 };
  const notes = [];
  let allowed = true;
  const pending = [];
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({
    gain: param(), frequency: param(), Q: param(),
    connect() { return this; }, disconnect() {},
    start(time) { counts.starts++; notes.push({ frequency: this.frequency.value, time }); },
    stop(time) { if (time === undefined) counts.cancels++; }
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
  return { audio, counts, notes, resume: () => pending.shift()?.(), setAllowed: value => allowed = value };
}

test('音效在用户操作前不创建音频上下文，按操作播放不同释放效果', () => {
  const { audio, counts } = fixture();
  assert.equal(counts.contexts, 0);
  audio.prepare(); audio.play('rain');
  assert.equal(counts.contexts, 1);
  assert.equal(counts.starts, 6);
  audio.play('glow');
  assert.equal(counts.starts, 10);
  audio.dispose();
});

test('后台不启动音效，恢复操作后可以继续，卸载永久释放', () => {
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

test('等待浏览器恢复音频后发声，等待期间取消或离开不会迟到发声', async () => {
  const first = fixture(true);
  first.audio.play('rain');
  assert.equal(first.counts.starts, 0);
  first.resume(); await new Promise(setImmediate);
  assert.equal(first.counts.starts, 6);
  first.audio.dispose();
  for (const action of ['cancel', 'dispose', 'hidden']) {
    const current = fixture(true);
    current.audio.play('rain');
    if (action === 'cancel') current.audio.stop();
    if (action === 'dispose') current.audio.dispose();
    if (action === 'hidden') current.setAllowed(false);
    current.resume(); await new Promise(setImmediate);
    assert.equal(current.counts.starts, 0);
    current.audio.dispose();
  }
});

test('长按蓄力的短音逐渐升调加快，限于两秒并可立即取消', () => {
  const { audio, counts, notes } = fixture();
  audio.startCharge(2000);
  assert(notes.length >= 8 && notes.length < 20);
  assert(notes[0].time >= .1);
  assert(notes.at(-1).time < 2);
  for (let i = 1; i < notes.length; i++) assert(notes[i].frequency > notes[i - 1].frequency);
  assert(notes[1].time - notes[0].time > notes.at(-1).time - notes.at(-2).time);
  audio.stop();
  assert.equal(counts.cancels, notes.length);
  const before = counts.starts;
  audio.play('rain');
  assert.equal(counts.starts, before + 6);
  audio.dispose();
});

test('浏览器尚未恢复音频时松开，蓄力音不会迟到补播', async () => {
  const { audio, counts, resume } = fixture(true);
  audio.startCharge(2000);
  audio.stop(); resume(); await new Promise(setImmediate);
  assert.equal(counts.starts, 0);
  audio.dispose();
});
