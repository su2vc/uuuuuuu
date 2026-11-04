import test from 'node:test';
import assert from 'node:assert/strict';
import { isBirthday, shouldCelebrateBirthday } from '../src/pages/game-album/birthdayRules.js';

test('ordinary days do not celebrate and the birthday repeats every year', () => {
  assert.equal(shouldCelebrateBirthday(new Date('2026-10-16T12:00:00+08:00')), false);
  assert.equal(shouldCelebrateBirthday(new Date('2027-10-20T12:00:00+08:00')), true);
  assert.equal(isBirthday(new Date('invalid')), false);
});

test('birthday starts and ends at midnight in Shanghai', () => {
  for (const [instant, birthday] of [
    ['2026-10-19T15:59:59.999Z', false],
    ['2026-10-19T16:00:00.000Z', true],
    ['2026-10-20T15:59:59.999Z', true],
    ['2026-10-20T16:00:00.000Z', false],
  ]) assert.equal(shouldCelebrateBirthday(new Date(instant)), birthday);
});

test('explicit birthday preview is local to the album', () => {
  assert.equal(shouldCelebrateBirthday(new Date('2026-10-16T12:00:00+08:00'), { birthdayTestMode: true }), true);
});
