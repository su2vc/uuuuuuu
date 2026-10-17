import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPlayPeriod } from '../src/playPeriod.js';

test('同月和跨月周期用无补零的月日展示，完整模式保留年份', () => {
  assert.equal(formatPlayPeriod({start: '2026-08-24', end: '2026-08-30'}), '8.24–8.30');
  const period = {start: '2026-08-31', end: '2026-10-18'};
  assert.equal(formatPlayPeriod(period), '8.31–10.18');
  assert.equal(formatPlayPeriod(period, {includeYear: true}), '2026.8.31–10.18');
});

test('跨年周期两端保留年份，相同日期只展示一次', () => {
  const period = {start: '2026-12-28', end: '2027-01-03'};
  assert.equal(formatPlayPeriod(period), '2026.12.28–2027.1.3');
  assert.equal(formatPlayPeriod(period, {includeYear: true}), '2026.12.28–2027.1.3');
  assert.equal(formatPlayPeriod({start: '2026-10-01', end: '2026-10-01'}), '10.1');
});

test('没有来源记录时明确标记未知', () => {
  assert.equal(formatPlayPeriod(null), '时间待补充');
});
