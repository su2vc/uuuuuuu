import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateContent, loadContent, contentAssetPaths} from '../src/content.js';

const fixture = () => JSON.parse(readFileSync(new URL('../public/content.json', import.meta.url), 'utf8'));

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
  ['不存在的日期', c => c.games[0].date = '2026-02-30', /日期不存在/],
  ['负数时长', c => c.games[0].hours = -1, /hours：/],
  ['零预览时长', c => c.games[0].memories[0].previewSeconds = 0, /previewSeconds：/],
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
    () => ({ok: true, json: async () => ({schemaVersion: 2, games: []})}),
  ]) await assert.rejects(loadContent('/content.json', {fetcher: response}));
  const result = await loadContent('/content.json', {fetcher: async () => ({ok: true, json: async () => fixture()})});
  assert.equal(result.games[0].id, 'peak');
});
