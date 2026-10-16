import {readFile, access} from 'node:fs/promises';
import {validateContent, contentAssetPaths} from '../src/content.js';

const root = new URL('../public/', import.meta.url);
const content = validateContent(JSON.parse(await readFile(new URL('content.json', root), 'utf8')));
const paths = contentAssetPaths(content).filter(path => !/^(?:https?:\/\/|\/)/.test(path));
for (const path of paths) {
  try {await access(new URL(path, root));}
  catch {throw new Error(`content.json 引用了不存在的本地素材：${path}`);}
}
console.log(`内容检查通过：${content.games.length} 款游戏，${paths.length} 个本地素材。`);
