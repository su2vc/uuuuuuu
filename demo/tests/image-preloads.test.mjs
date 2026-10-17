import test from 'node:test';
import assert from 'node:assert/strict';
import { imagePreloadGroups, preloadImageGroups } from '../src/imagePreloads.js';
import { openingPhotoPaths } from '../src/openingPhotos.js';

test('warms first-screen pictures before navigation, deduplicates paths and excludes video files', () => {
  const groups = imagePreloadGroups({
    avatars: [{ src: 'avatar.png' }],
    games: [
      { character: 'first.png', memories: [
        { type: 'gallery', images: [{ src: 'photo.jpg' }, { src: 'photo.jpg' }] },
        { type: 'video', src: 'movie.mp4', poster: 'cover.jpg' },
        { type: 'featuredVideo', src: 'special.mp4' },
        { type: 'text', excerpt: '文字' },
      ] },
      { character: 'next.png', memories: [{ type: 'gallery', images: [{ src: 'later.jpg' }] }] },
      { character: 'last.png', memories: [] },
      { character: 'first.png', memories: [] },
    ],
  });
  assert.deepEqual(groups[0], ['first.png', 'avatar.png', 'photo.jpg', 'cover.jpg']);
  assert.deepEqual(groups[1], ['next.png', ...openingPhotoPaths, 'last.png']);
  assert.ok(!groups.flat().some(path => /\.mp4$|later\.jpg/.test(path)));
});

test('sets anonymous CORS before starting an uploaded image request', async () => {
  class TestImage {
    set src(url) {
      assert.equal(url, 'https://bucket.oss-cn-hongkong.aliyuncs.com/uu-album/photo.webp');
      assert.equal(this.crossOrigin, 'anonymous');
      this.onload();
    }
  }
  await preloadImageGroups([['photo']], () => 'https://bucket.oss-cn-hongkong.aliyuncs.com/uu-album/photo.webp', TestImage);
});

test('limits image concurrency, finishes priority images first, and continues after a failed image', async () => {
  const events = [];
  let active = 0;
  let maximum = 0;
  class TestImage {
    set src(url) {
      active++;
      maximum = Math.max(maximum, active);
      events.push(['start', url, this.fetchPriority]);
      setImmediate(() => {
        active--;
        events.push(['finish', url]);
        (url === '/optimized/broken' ? this.onerror : this.onload)();
      });
    }
  }
  await preloadImageGroups([['a', 'b', 'broken', 'd'], [], ['e', 'f']], path => `/optimized/${path}`, TestImage);
  assert.equal(maximum, 3);
  assert.equal(active, 0);
  assert.deepEqual(events.filter(([type]) => type === 'start'), [
    ['start', '/optimized/a', 'high'], ['start', '/optimized/b', 'high'],
    ['start', '/optimized/broken', 'high'], ['start', '/optimized/d', 'high'],
    ['start', '/optimized/e', 'low'], ['start', '/optimized/f', 'low'],
  ]);
  assert.ok(events.findIndex(([type, url]) => type === 'finish' && url.endsWith('/d'))
    < events.findIndex(([type, url]) => type === 'start' && url.endsWith('/e')));
});
