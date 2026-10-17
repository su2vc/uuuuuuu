import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoWheelHandler } from '../src/photoWheel.js';

function fixture() {
  let time = 0;
  const moves = [];
  const wheel = createPhotoWheelHandler(delta => moves.push(delta), { now: () => time });
  const send = (deltaY, advance = 10, extra = {}) => {
    time += advance;
    let prevented = false;
    let stopped = false;
    const handled = wheel({ deltaX: 0, deltaY, deltaMode: 0, ...extra,
      preventDefault() { prevented = true; }, stopPropagation() { stopped = true; },
    });
    return { handled, prevented, stopped };
  };
  return { moves, send };
}

test('触控板微小滚动累计到阈值再切图，同方向尾事件不会连翻', () => {
  const { moves, send } = fixture();
  assert.equal(send(12).prevented, true);
  send(12); send(16);
  assert.deepEqual(moves, [1]);
  for (let i = 0; i < 30; i++) send(20);
  assert.deepEqual(moves, [1]);
  send(120, 200);
  assert.deepEqual(moves, [1, 1]);
});

test('反向滚动立即响应，水平滚轮及行/页单位也能切图', () => {
  const { moves, send } = fixture();
  send(120); send(-120);
  send(0, 200, { deltaX: 60 });
  send(-3, 200, { deltaMode: 1 });
  send(1, 200, { deltaMode: 2 });
  assert.deepEqual(moves, [1, -1, 1, -1, 1]);
});

test('不拦截缩放、无效输入或已被其他交互处理的事件', () => {
  const { moves, send } = fixture();
  for (const [delta, extra] of [[120, { ctrlKey: true }], [0, {}], [NaN, {}], [120, { defaultPrevented: true }], [120, { cancelable: false }]]) {
    assert.deepEqual(send(delta, 10, extra), { handled: false, prevented: false, stopped: false });
  }
  assert.deepEqual(moves, []);
});
