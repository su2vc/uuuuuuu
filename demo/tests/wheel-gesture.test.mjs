import test from 'node:test';
import assert from 'node:assert/strict';
import {wheelDelta, moveTimeline} from '../src/wheelGesture.js';
const wheel = (y, extra = {}) => ({deltaY:y, deltaX:0, deltaMode:0, ...extra});

test('a sustained gesture can move across several games without a cooldown', () => {
  let position=0;
  for(let t=0;t<960;t+=16) position=moveTimeline(position,wheelDelta(wheel(15)),240,13);
  assert.equal(position,3.75);
});
test('decelerating into a sustained slow scroll never gets swallowed', () => {
  const input=[30,27,23,19,15,12,10,10,10,.2,.2];
  assert.deepEqual(input.map(y=>wheelDelta(wheel(y))),input);
});
test('short fractional and reverse input remains exact', () => {
  assert.equal(moveTimeline(4,wheelDelta(wheel(24)),240,13),4.1);
  assert.equal(wheelDelta(wheel(-.1)),-.1);
});
test('line/page units work and unrelated gestures are ignored', () => {
  assert.equal(wheelDelta(wheel(3,{deltaMode:1})),54);
  assert.equal(wheelDelta(wheel(-1,{deltaMode:2}),600),-600);
  assert.equal(wheelDelta(wheel(100,{ctrlKey:true})),0);
  assert.equal(wheelDelta(wheel(20,{deltaX:120})),0);
});
test('timeline boundaries do not accumulate overscroll', () => {
  assert.equal(moveTimeline(0,-900,240,13),0);
  assert.equal(moveTimeline(12,900,240,13),12);
  assert.equal(moveTimeline(12,-24,240,13),11.9);
});
