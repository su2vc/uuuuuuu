import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { build } from 'vite';
import { optimizedImages } from '../scripts/optimized-images.mjs';

test('production emits hashed WebP images with transparent masks and relative deployment URLs', async () => {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'uu-image-build-')));
  try {
    const assets = path.join(root, 'public/assets');
    await mkdir(assets, { recursive: true });
    const character = await sharp({ create: { width: 320, height: 320, channels: 4, background: '#0000' } })
      .composite([{ input: await sharp({ create: { width: 80, height: 80, channels: 4, background: '#fcbf49' } }).png().toBuffer() }])
      .png({ compressionLevel: 0 }).toBuffer();
    await writeFile(path.join(assets, 'character.png'), character);
    await writeFile(path.join(assets, 'avatar-birthday.png'), character);
    await writeFile(path.join(root, 'index.html'), '<script type="module" src="./main.js"></script>');
    await writeFile(path.join(root, 'main.js'), 'import images from "virtual:optimized-images"; window.images = images;');
    const result = await build({
      root, configFile: false, base: './', logLevel: 'silent', plugins: [optimizedImages()],
      build: { write: false, minify: false },
    });
    const images = result.output.filter(file => file.type === 'asset' && file.fileName.endsWith('.webp'));
    assert.equal(images.length, 2);
    for (const image of images) {
      assert.match(image.fileName, /^assets\/optimized-.+-[\w-]+\.webp$/);
      const metadata = await sharp(image.source).metadata();
      assert.equal(metadata.format, 'webp');
      assert.equal(metadata.hasAlpha, true);
      assert.equal(metadata.width, image.fileName.includes('avatar-birthday') ? 256 : 320);
      const { channels } = await sharp(image.source).stats();
      assert.equal(channels[3].min, 0);
      assert.equal(channels[3].max, 255);
      assert.ok(image.source.length < character.length);
      const chunk = result.output.find(file => file.type === 'chunk');
      assert.ok(chunk.code.includes(path.basename(image.fileName)));
      assert.ok(chunk.code.includes('import.meta.url'));
    }
    assert.deepEqual(await readFile(path.join(assets, 'character.png')), character);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
