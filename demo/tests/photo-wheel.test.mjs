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

test('连续滚动按距离持续切图，无需停顿或移动鼠标重新触发', () => {
  const { moves, send } = fixture();
  assert.equal(send(12).prevented, true);
  send(28); send(40);
  assert.deepEqual(moves, [1]);
  for (let i = 0; i < 8; i++) send(20);
  assert.deepEqual(moves, [1, 1, 1]);
  send(240);
  assert.deepEqual(moves, [1, 1, 1, 3]);
  send(40); send(40);
  assert.deepEqual(moves, [1, 1, 1, 3, 1]);
});

test('反向滚动立即响应，水平滚轮及行/页单位也能切图', () => {
  const { moves, send } = fixture();
  send(80); send(-80);
  send(0, 200, { deltaX: 80 });
  send(-5, 200, { deltaMode: 1 });
  send(1, 200, { deltaMode: 2 });
  assert.deepEqual(moves, [1, -1, 1, -1, 5]);
});

test('停滚后不保留残余距离，反向滚动不必抵消旧方向', () => {
  const { moves, send } = fixture();
  send(60); send(20, 200);
  assert.deepEqual(moves, []);
  send(60);
  send(60); send(-80);
  assert.deepEqual(moves, [1, -1]);
});

test('不拦截缩放、无效输入或已被其他交互处理的事件', () => {
  const { moves, send } = fixture();
  for (const [delta, extra] of [[120, { ctrlKey: true }], [0, {}], [NaN, {}], [120, { defaultPrevented: true }], [120, { cancelable: false }]]) {
    assert.deepEqual(send(delta, 10, extra), { handled: false, prevented: false, stopped: false });
  }
  assert.deepEqual(moves, []);
});
