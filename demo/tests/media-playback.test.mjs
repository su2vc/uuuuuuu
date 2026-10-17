import assert from 'node:assert/strict';
import test from 'node:test';
import { pauseOtherVideos } from '../src/mediaPlayback.js';

test('新视频播放时暂停其余正在播放的视频，保留暂停状态及播放位置', () => {
  const makeVideo = paused => ({paused, currentTime: 12, pauses: 0, pause() { this.pauses++; this.paused = true; }});
  const current = makeVideo(false), other = makeVideo(false), paused = makeVideo(true);
  current.ownerDocument = {querySelectorAll: selector => { assert.equal(selector, 'video'); return [current, other, paused]; }};
  pauseOtherVideos(current);
  assert.equal(current.pauses, 0);
  assert.equal(other.pauses, 1);
  assert.equal(paused.pauses, 0);
  assert.equal(other.currentTime, 12);
  pauseOtherVideos(current);
  assert.equal(other.pauses, 1);
});
