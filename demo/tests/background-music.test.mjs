import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackgroundMusic } from '../src/backgroundMusic.js';

function fixture({ suspended = false } = {}) {
  let allowed = true, contexts = 0, starts = 0, blocked = 0, finishResume;
  const gains = [];
  const param = () => ({ value: 0,
    cancelScheduledValues() {},
    setValueAtTime(value) { this.value = value; },
    setTargetAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime(value) { this.value = value; }
  });
  const node = () => ({ connect() { return this; }, disconnect() {}, start() { starts++; }, stop() {}, frequency: param() });
  const context = {
    state: suspended ? 'suspended' : 'running', currentTime: 0,
    createGain() { const gain = { ...node(), gain: param() }; gains.push(gain); return gain; },
    createOscillator: node,
    resume() {
      if (context.state === 'running') return Promise.resolve();
      return new Promise(resolve => { finishResume = () => { context.state = 'running'; resolve(); }; });
    }
  };
  const music = createBackgroundMusic({
    getContext: () => { contexts++; return context; }, canPlay: () => allowed, onBlocked: () => blocked++
  });
  return { music, gains, get contexts() { return contexts; }, get starts() { return starts; }, get blocked() { return blocked; },
    allow: value => allowed = value, resume: () => finishResume?.() };
}

test('只在进入游戏页后播放，视频暂停恢复遵守手动音乐开关', async () => {
  const f = fixture();
  try {
    f.music.setEntered(false);
    assert.equal(f.contexts, 0);
    f.music.setEntered(true);
    await new Promise(setImmediate);
    assert(f.starts > 0);
    const master = f.gains[0].gain;
    assert.equal(master.value, .55);
    f.allow(false); f.music.sync();
    assert.equal(master.value, 0);
    f.allow(true); f.music.sync();
    await new Promise(setImmediate);
    assert.equal(master.value, .55);
    f.music.setEnabled(false);
    f.allow(false); f.music.sync(); f.allow(true); f.music.sync();
    assert.equal(master.value, 0);
    f.music.setEnabled(true);
    await new Promise(setImmediate);
    assert.equal(master.value, .55);
  } finally { f.music.dispose(); }
});

test('异步音频恢复期间退出、关音乐或开始视频不会迟到播放', async () => {
  for (const action of ['dispose', 'off', 'video']) {
    const f = fixture({ suspended: true });
    try {
      f.music.setEntered(true);
      if (action === 'dispose') f.music.dispose();
      if (action === 'off') f.music.setEnabled(false);
      if (action === 'video') f.allow(false);
      f.resume(); await new Promise(setImmediate);
      assert.equal(f.starts, 0);
      assert.equal(f.blocked, 0);
    } finally { f.music.dispose(); }
  }
});
