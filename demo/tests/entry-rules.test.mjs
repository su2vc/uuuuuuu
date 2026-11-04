import test from 'node:test';
import assert from 'node:assert/strict';
import { entryDecision } from '../src/entry/entryRules.js';
import { createPageRegistry, pages } from '../src/app/pageRegistry.js';

test('only the complete correct password grants entry',()=>{
 for(const value of ['', '102', '020', '0000', '10200', '1020 ', '0621'])assert.equal(entryDecision(value).granted,false);
 assert.equal(entryDecision('1020').granted,true);
});
test('existing password selects the album and preserves its blocked state', () => {
 assert.deepEqual(entryDecision('1020'), { granted: true, pageId: 'game-album' });
 assert.equal(pages.find(page => page.id === 'game-album').blocked, true);
});
test('different passwords select different pages without loading either page', () => {
 let loads = 0;
 const registry = createPageRegistry([
  { id: 'game-album', title: '纪念册', password: '1020', blocked: true, load: () => { loads++; } },
  { id: 'new-idea', title: '新点子', password: '00123456', load: () => { loads++; } },
 ]);
 assert.deepEqual(entryDecision('1020', registry), { granted: true, pageId: 'game-album' });
 assert.deepEqual(entryDecision('00123456', registry), { granted: true, pageId: 'new-idea' });
 assert.deepEqual(entryDecision('123456', registry), { granted: false, pageId: null });
 assert.equal(registry[1].blocked, false);
 assert.equal(loads, 0);
});

test('invalid inputs never select a page', () => {
 for (const password of [null, undefined, 1020, '', '1020 ', ' 1020', '１０２０', 'unknown', '__proto__']) {
  assert.deepEqual(entryDecision(password), { granted: false, pageId: null });
 }
});

test('duplicate IDs or passwords fail registration', () => {
 const page = { id: 'one', title: '一', password: '1234', load: () => {} };
 assert.throws(() => createPageRegistry([page, { ...page, password: '5678' }]), /重复页面 id/);
 assert.throws(() => createPageRegistry([page, { ...page, id: 'two' }]), /同一密码/);
});

test('invalid page configuration fails registration', () => {
 const valid = { id: 'one', title: '一', password: '1234', load: () => {} };
 for (const invalid of [
  { id: '../other' }, { id: 'Uppercase' }, { id: undefined }, { title: '' },
  { password: 1234 }, { password: '' }, { password: '123456789' }, { password: 'word' },
  { load: undefined }, { blocked: 'false' },
 ]) assert.throws(() => createPageRegistry([{ ...valid, ...invalid }]));
});
