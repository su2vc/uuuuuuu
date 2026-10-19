import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { openingPhotoPaths } from '../src/openingPhotos.js';

test('图像使用 OSS 映射或上传直链，小型开屏风景可随项目静态发布', async () => {
  const config = JSON.parse(await readFile(new URL('../oss-images.json', import.meta.url)));
  const content = JSON.parse(await readFile(new URL('../public/content.json', import.meta.url)));
  assert.equal(config.origin, 'https://uu-memories-1.oss-cn-hongkong.aliyuncs.com');
  const paths = new Set();
  const keys = new Set();
  for (const image of config.images) {
    assert.ok(!paths.has(image.sourcePath), `Duplicate source: ${image.sourcePath}`);
    assert.ok(!keys.has(image.objectKey), `Duplicate object: ${image.objectKey}`);
    paths.add(image.sourcePath);
    keys.add(image.objectKey);
    assert.match(image.objectKey, /^uu-album\/.+\.webp$/);
    assert.ok(image.objectKey.endsWith(`-${image.sha256.slice(0, 10)}.webp`));
    assert.ok(image.bytes > 0);
  }
  const required = [
    ...content.avatars.map(avatar => avatar.src),
    ...openingPhotoPaths, 'assets/opening-reference.png',
    ...content.games.flatMap(game => [game.character, ...game.memories.flatMap(memory =>
      memory.type === 'gallery' ? memory.images.map(image => image.src) : memory.poster ? [memory.poster] : []
    )]),
  ];
  for (const path of required) {
    if (/^https?:\/\//.test(path)) {
      const uploaded = new URL(path);
      assert.equal(uploaded.origin, config.origin, `Uploaded image must use the configured OSS origin: ${path}`);
      assert.match(uploaded.pathname, /^\/uu-album\/.+\.(?:jpe?g|png|webp)$/i);
    } else if (openingPhotoPaths.includes(path) && path.startsWith('assets/opening/')) {
      const file = await readFile(new URL(`../public/${path}`, import.meta.url));
      assert.ok(file.length > 0 && file.length < 80000, `Opening asset must stay small: ${path}`);
    } else assert.ok(paths.has(path), `Missing OSS mapping: ${path}`);
  }
});
