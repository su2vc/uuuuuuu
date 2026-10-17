import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateContent, prepareContent, groupMemories, loadContent, contentAssetPaths} from '../src/content.js';

const fixture = () => JSON.parse(readFileSync(new URL('../public/content.json', import.meta.url), 'utf8'));

test('按游玩周期起点跨年升序排序，同日稳定，不改变源数据或回忆顺序', () => {
  const content = fixture();
  content.games = content.games.slice(0, 4);
  ['2026-12-01', '2025-12-31', '2026-01-01', '2026-01-01'].forEach((date, i) => content.games[i].playPeriod = {start: date, end: date});
  content.games[0].memories.reverse();
  const before = structuredClone(content);
  const result = prepareContent(content);
  assert.deepEqual(result.games.map(g => g.id), [content.games[1].id, content.games[2].id, content.games[3].id, content.games[0].id]);
  assert.deepEqual(result.games[3].memories.map(m => m.id), content.games[0].memories.map(m => m.id));
  assert.deepEqual(content, before);
});

test('最小配置支持未知时长、单张图片、短文字、空回忆，并统一补默认值', () => {
  const content = {schemaVersion: 4, avatars: [], games: [{
    id: 'minimal', title: '游戏', playPeriod: {start: '2026-01-01', end: '2026-01-07'}, hours: null, character: 'assets/example.png',
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
  assert.equal(result.games[0].memories[0].date, null);
  assert.deepEqual(result.games[0].memories[0].paragraphs, []);
  assert.equal(result.games[0].memories[1].images[0].caption, '');
  content.games[0].memories = [];
  assert.deepEqual(prepareContent(content).games[0].memories, []);
});

test('普通与特别视频可只填视频地址，缺少视频和封面则拒绝', () => {
  const content = fixture();
  const game = content.games.find(game => game.id === 'split');
  game.memories = ['video', 'featuredVideo'].map((type, i) => ({
    id: `clip-${i}`, type, title: '无独立封面', src: `https://media.example.com/${i}.mp4`,
    ...(i === 0 ? {poster: ''} : {})
  }));
  const prepared = prepareContent(content);
  assert.equal(prepared.games.find(game => game.id === 'split').memories.length, 2);
  assert(contentAssetPaths(content).includes('https://media.example.com/0.mp4'));
  assert(!contentAssetPaths(content).includes(undefined));
  delete game.memories[0].src;
  assert.throws(() => prepareContent(content), /视频地址与封面至少填写一项/);
  game.memories[0].src = '   ';
  assert.throws(() => prepareContent(content), /视频地址与封面至少填写一项/);
});

test('图片组与每张图都可省略文字，空白文字归一为空且仍校验字段类型', () => {
  const content = fixture();
  content.games[0].memories = [{ id: 'screenshots', type: 'gallery', images: [{ src: 'assets/photo.jpg' }] }];
  const prepareGallery = () => prepareContent(content).games.find(game => game.id === content.games[0].id).memories[0];
  assert.equal(prepareGallery().title, '');
  assert.equal(prepareGallery().images[0].caption, '');
  content.games[0].memories[0].title = '  ';
  content.games[0].memories[0].images[0].caption = '  ';
  assert.equal(prepareGallery().title, '');
  assert.equal(prepareGallery().images[0].caption, '');
  content.games[0].memories[0].title = 123;
  assert.throws(prepareGallery, /title：应为文字/);
  content.games[0].memories[0].title = '';
  content.games[0].memories[0].images[0].caption = {};
  assert.throws(prepareGallery, /caption：应为文字/);
});

test('所有游戏统一图文在前、视频在后，组内保持原顺序且不修改源数据', () => {
  for (const game of fixture().games) {
    const before = structuredClone(game.memories);
    const { photos, notes, videos } = groupMemories(game.memories);
    assert.deepEqual(photos, game.memories.filter(m => m.type === 'gallery'));
    assert.deepEqual(notes, game.memories.filter(m => m.type === 'text'));
    assert.deepEqual(videos, game.memories.filter(m => ['video', 'featuredVideo'].includes(m.type)));
    assert.deepEqual(game.memories, before);
    assert.equal(photos.length + notes.length + videos.length, game.memories.length);
    if (game.id === 'split') assert.equal(videos[0].id, 'split-special');
  }
  assert.deepEqual(groupMemories([]), { photos: [], notes: [], videos: [] });
});

test('实际加载出口排序，修改周期起点后默认首款游戏随之改变', async () => {
  const content = fixture();
  content.games.at(-1).playPeriod = {start: '2020-01-01', end: '2020-01-07'};
  const result = await loadContent('/content.json', {fetcher: async () => ({ok: true, json: async () => content})});
  assert.equal(result.games[0].id, 'nomad');
});

test('未知周期稳定排在已知周期之后，不为回忆虚构具体日期', () => {
  const content = fixture();
  content.games = content.games.slice(0, 4);
  content.games[0].playPeriod = null;
  content.games[2].playPeriod = null;
  content.games[0].hours = null;
  delete content.games[0].memories[0].date;
  const result = prepareContent(content);
  assert.deepEqual(result.games.slice(-2).map(game => game.id), [content.games[0].id, content.games[2].id]);
  assert.equal(result.games.at(-2).memories[0].date, null);
  assert.equal(result.games.at(-2).hours, null);
});

test('现有 11 款游戏与所有回忆类型通过数据边界', () => {
  const content = fixture();
  assert.equal(validateContent(content), content);
  assert.equal(content.games.length, 11);
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
  ['不存在的日期', c => c.games[0].playPeriod.start = '2026-02-30', /日期不存在/],
  ['负数时长', c => c.games[0].hours = -1, /hours：/],
  ['字符串时长', c => c.games[0].hours = '12.5', /hours：/],
  ['缺失游玩周期', c => delete c.games[0].playPeriod, /playPeriod：/],
  ['错误演示开关', c => c.demoMode = 'false', /demoMode：/],
  ['零预览时长', c => c.games.flatMap(game => game.memories).find(m => m.type === 'video').previewSeconds = 0, /previewSeconds：/],
  ['倒置游玩周期', c => c.games[0].playPeriod.end = '2026-01-01', /结束日期不能早于开始日期/],
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
    () => ({ok: true, json: async () => ({schemaVersion: 4, games: []})}),
  ]) await assert.rejects(loadContent('/content.json', {fetcher: response}));
  const result = await loadContent('/content.json', {fetcher: async () => ({ok: true, json: async () => fixture()})});
  assert.equal(result.games[0].id, 'peak');
});
