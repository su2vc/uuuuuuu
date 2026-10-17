import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const moduleId = 'virtual:optimized-images';
const resolvedId = `\0${moduleId}`;

async function imageFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? imageFiles(file) : /\.(png|jpe?g|webp)$/i.test(entry.name) ? [file] : [];
  }));
  return nested.flat().sort();
}

// Original content paths stay editable; production resolves them to hashed WebP assets.
export function optimizedImages() {
  let config;
  return {
    name: 'optimized-images',
    configResolved(value) { config = value; },
    resolveId(id) { if (id === moduleId) return resolvedId; },
    async load(id) {
      if (id !== resolvedId) return;
      if (config.command !== 'build') return 'export default {};';
      const files = await imageFiles(path.join(config.publicDir, 'assets'));
      const entries = [];
      let originalBytes = 0;
      let optimizedBytes = 0;
      // Bound decoder memory while processing large source images.
      for (let offset = 0; offset < files.length; offset += 4) {
        await Promise.all(files.slice(offset, offset + 4).map(async file => {
          const key = path.relative(config.publicDir, file).split(path.sep).join('/');
          const original = await readFile(file);
          const size = key === 'assets/avatar-birthday.png' ? 256 : 1440;
          const optimized = await sharp(original).rotate()
            .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 86, alphaQuality: 100, effort: 4 }).toBuffer();
          originalBytes += original.length;
          optimizedBytes += Math.min(original.length, optimized.length);
          if (optimized.length >= original.length) return;
          const reference = this.emitFile({
            type: 'asset',
            name: `optimized-${key.slice('assets/'.length).replace(/\.[^.]+$/, '.webp').replaceAll('/', '-')}`,
            source: optimized,
          });
          entries.push(`${JSON.stringify(key)}: import.meta.ROLLUP_FILE_URL_${reference}`);
        }));
      }
      config.logger.info(`图片优化：${files.length} 张，${(originalBytes / 1048576).toFixed(2)} → ${(optimizedBytes / 1048576).toFixed(2)} MiB（原图保留）`);
      return `export default {${entries.sort().join(',\n')}};`;
    },
  };
}
