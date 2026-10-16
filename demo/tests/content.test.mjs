import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateContent, prepareContent, resolveMemoryLayout, loadContent, contentAssetPaths} from '../src/content.js';

const fixture = () => JSON.parse(readFileSync(new URL('../public/content.json', import.meta.url), 'utf8'));

test('按首次游玩时间跨年升序排序，同日稳定，不改变源数据或回忆顺序', () => {
  const content = fixture();
  content.games = content.games.slice(0, 4);
  ['2026-12-01', '2025-12-31', '2026-01-01', '2026-01-01'].forEach((date, i) => content.games[i].firstTime = date);
  content.games[0].memories.reverse();
  const before = structuredClone(content);
  const result = prepareContent(content);
  assert.deepEqual(result.games.map(g => g.id), [content.games[1].id, content.games[2].id, content.games[3].id, content.games[0].id]);
  assert.deepEqual(result.games[3].memories.map(m => m.id), content.games[0].memories.map(m => m.id));
  assert.deepEqual(content, before);
});

test('最小配置支持未知时长、单张图片、短文字、空回忆，并统一补默认值', () => {
  const content = {schemaVersion: 3, avatars: [], games: [{
    id: 'minimal', title: '游戏', firstTime: '2026-01-01', hours: null, character: 'assets/example.png',
    memories: [
      {id: 'note', type: 'text', title: '一小段', excerpt: '今天很开心。'},
      {id: 'photo', type: 'gallery', title: '一张照片', images: [{src: 'assets/example.png'}]},
      {id: 'video', type: 'video', title: '预留', poster: 'assets/example.png'}
    ]
  }]};
  const result = prepareContent(content);
  assert.equal(result.demoMode, false);
  assert.equal(result.games[0].hours, null);
  assert.equal(result.games[0].layout, 'auto');
  assert.equal(result.games[0].platform, 'Steam');
  assert.equal(result.games[0].memories[0].date, '2026-01-01');
  assert.deepEqual(result.games[0].memories[0].paragraphs, []);
  assert.equal(result.games[0].memories[1].images[0].caption, '');
  content.games[0].memories = [];
  assert.deepEqual(prepareContent(content).games[0].memories, []);
});

test('布局适配同类回忆增减与重新排序；特别视频保留独立类型', () => {
  const games = fixture().games;
  for (const game of games.filter(g => g.id !== 'repo')) {
    assert.equal(resolveMemoryLayout(game), game.layout);
    assert.equal(resolveMemoryLayout({...game, memories: [...game.memories, game.memories[0]]}), 'auto');
    assert.equal(resolveMemoryLayout({...game, memories: game.memories.slice(1)}), 'auto');
    assert.equal(resolveMemoryLayout({...game, memories: [...game.memories].reverse()}), 'auto');
  }
  assert.equal(resolveMemoryLayout(games.find(g => g.id === 'repo')), 'auto');
  assert.equal(games.find(g => g.id === 'split').memories[0].type, 'featuredVideo');
});

test('实际加载出口排序，修改首次日期后默认首款游戏随之改变', async () => {
  const content = fixture();
  content.games.at(-1).firstTime = '2020-01-01';
  const result = await loadContent('/content.json', {fetcher: async () => ({ok: true, json: async () => content})});
  assert.equal(result.games[0].id, 'nomad');
});

test('现有 13 款游戏与所有回忆类型通过数据边界', () => {
  const content = fixture();
  assert.equal(validateContent(content), content);
  assert.equal(content.games.length, 13);
  assert.deepEqual(new Set(content.games.flatMap(game => game.memories.map(memory => memory.type))), new Set(['video', 'gallery', 'text', 'featuredVideo']));
  assert(contentAssetPaths(content).includes(content.avatars[0].src));
  assert(!contentAssetPaths(content).includes(''));
});

for (const [name, mutate, message] of [
  ['空游戏列表', c => c.games = [], /games：/],
  ['重复游戏 ID', c => c.games[1].id = c.games[0].id, /games\[1\].id：重复/],
  ['重复回忆 ID', c => c.games[0].memories[1].id = c.games[0].memories[0].id, /memories\[1\].id：重复/],
  ['空相册', c => c.games[0].memories.find(m => m.type === 'gallery').images = [], /images：/],
  ['未知回忆类型', c => c.games[0].memories[0].type = 'typo', /type：/],
  ['错误文字结构', c => c.games[0].memories.find(m => m.type === 'text').paragraphs = null, /paragraphs：/],
  ['不存在的日期', c => c.games[0].firstTime = '2026-02-30', /日期不存在/],
  ['负数时长', c => c.games[0].hours = -1, /hours：/],
  ['字符串时长', c => c.games[0].hours = '12.5', /hours：/],
  ['缺失首次日期', c => delete c.games[0].firstTime, /firstTime：/],
  ['错误演示开关', c => c.demoMode = 'false', /demoMode：/],
  ['零预览时长', c => c.games[0].memories.find(m => m.type === 'video').previewSeconds = 0, /previewSeconds：/],
  ['不支持的数据版本', c => c.schemaVersion = 999, /schemaVersion：/],
]) {
  test(`${name}在渲染前给出字段位置`, () => {
    const content = fixture(); mutate(content);
    assert.throws(() => validateContent(content), message);
  });
}

test('HTTP 错误包含状态码', async () => {
  await assert.rejects(loadContent('/content.json', {fetcher: async () => ({ok: false, status: 404})}), /HTTP 404/);
});

test('加载传递 AbortSignal，解析期间取消的旧结果不会提交', async () => {
  const controller = new AbortController();
  const request = loadContent('/content.json', {signal: controller.signal, fetcher: async (url, options) => {
    assert.equal(url, '/content.json');
    assert.equal(options.signal, controller.signal);
    return {ok: true, json: async () => {controller.abort(); return fixture();}};
  }});
  await assert.rejects(request, {name: 'AbortError'});
});

test('网络、JSON 及数据结构错误都会传给调用方，随后可重新加载', async () => {
  for (const response of [
    () => {throw new Error('offline');},
    () => ({ok: true, json: async () => {throw new SyntaxError('bad JSON');}}),
    () => ({ok: true, json: async () => ({schemaVersion: 3, games: []})}),
  ]) await assert.rejects(loadContent('/content.json', {fetcher: response}));
  const result = await loadContent('/content.json', {fetcher: async () => ({ok: true, json: async () => fixture()})});
  assert.equal(result.games[0].id, 'peak');
});
