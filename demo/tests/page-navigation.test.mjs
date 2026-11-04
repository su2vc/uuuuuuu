import test from 'node:test';
import assert from 'node:assert/strict';
import { pageHash, parsePageHash } from '../src/shared/navigation.js';
import { activePage } from '../src/app/pageAccess.js';
import { createPageRegistry } from '../src/app/pageRegistry.js';

const registry = createPageRegistry([
  { id: 'game-album', title: '纪念册', password: '1020', blocked: true, load: () => {} },
  { id: 'new-idea', title: '新点子', password: '123456', load: () => {} },
]);

test('page and game navigation use separate route segments', () => {
  assert.equal(pageHash('game-album'), '#/game-album');
  assert.equal(pageHash('game-album', ['peak']), '#/game-album/peak');
  assert.deepEqual(parsePageHash('#/game-album/peak'), { pageId: 'game-album', segments: ['peak'] });
  const nested = ['我的章节', 'part/one'];
  assert.deepEqual(parsePageHash(pageHash('new-idea', nested)), { pageId: 'new-idea', segments: nested });
});

test('entrance, legacy and malformed hashes are handled safely', () => {
  for (const hash of ['', '#', '#/', '#peak', '#/../secret', '#/%E0%A4', null]) {
    assert.deepEqual(parsePageHash(hash), { pageId: null, segments: [] });
  }
  assert.throws(() => pageHash('../secret'));
});

test('a direct URL or refresh without an in-memory entry cannot open a page', () => {
  for (const hash of ['#/game-album', '#/game-album/peak', '#/new-idea']) {
    assert.equal(activePage(null, hash, registry), null);
  }
});

test('unlocking a page grants only that page and its internal sections', () => {
  const entry = { pageId: 'game-album' };
  assert.equal(activePage(entry, '#/game-album', registry), registry[0]);
  assert.equal(activePage(entry, '#/game-album/peak', registry), registry[0]);
  assert.equal(activePage(entry, '#/new-idea', registry), null);
  assert.equal(activePage(entry, '#/', registry), null);
  assert.equal(activePage({ pageId: 'missing' }, '#/missing', registry), null);
  assert.equal(activePage({ pageId: 'new-idea' }, '#/new-idea', registry), registry[1]);
});
