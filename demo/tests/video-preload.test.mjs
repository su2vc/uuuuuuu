import assert from 'node:assert/strict';
import test from 'node:test';
import { observeVideoPreload } from '../src/videoPreload.js';

function fixture() {
  let notify, options, disconnects = 0, loads = 0;
  const root = {}, video = { closest(selector) { assert.equal(selector, '.memories'); return root; } };
  class Observer {
    constructor(callback, config) { notify = callback; options = config; }
    observe(element) { assert.equal(element, video); }
    disconnect() { disconnects++; }
  }
  const dispose = observeVideoPreload(video, () => loads++, Observer);
  return { root, dispose, get options() { return options; }, get loads() { return loads; }, get disconnects() { return disconnects; },
    intersect: value => notify([{ isIntersecting: value }]) };
}

test('屏幕外不预读，接近相册滚动视口才预读一次', () => {
  const f = fixture();
  assert.equal(f.options.root, f.root);
  assert.equal(f.options.rootMargin, '240px 0px');
  f.intersect(false); assert.equal(f.loads, 0);
  f.intersect(true); assert.equal(f.loads, 1); assert.equal(f.disconnects, 1);
  f.intersect(true); assert.equal(f.loads, 1);
  f.dispose();
});

test('卸载或切游戏取消观察，过期通知不会再预读', () => {
  const f = fixture();
  f.dispose(); f.intersect(true);
  assert.equal(f.loads, 0);
  assert.equal(f.disconnects, 1);
});

test('不支持视口观察的浏览器保留原来的元数据预读', () => {
  let loads = 0;
  const dispose = observeVideoPreload({}, () => loads++, null);
  assert.equal(loads, 1); dispose();
});
