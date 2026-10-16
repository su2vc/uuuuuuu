// Presets are safe only for these compositions in visual reading order.
const layoutSequences = {
  trail: ['gallery', 'text', 'video'],
  evidence: ['video', 'text', 'gallery'],
  collage: ['video', 'gallery', 'text'],
  roadtrip: ['gallery', 'video', 'text'],
  duet: ['featuredVideo', 'video', 'gallery', 'text'],
  arcade: ['gallery', 'video', 'text']
};
const layouts = new Set(['auto', ...Object.keys(layoutSequences)]);
const types = new Set(['video', 'featuredVideo', 'gallery', 'text']);
const fail = (path, message) => {
  throw new Error(`${path}：${message}`);
};
const requireValue = (valid, path, message) => {
  if (!valid) fail(path, message);
};
const object = (value, path) => requireValue(value && typeof value === 'object' && !Array.isArray(value), path, '应为对象');
const text = (value, path) => requireValue(typeof value === 'string' && value.trim().length > 0, path, '应为非空文字');
const array = (value, path, nonempty = false) => requireValue(Array.isArray(value) && (!nonempty || value.length > 0), path, nonempty ? '应为非空数组' : '应为数组');
const date = (value, path) => {
  text(value, path);
  requireValue(/^\d{4}-\d{2}-\d{2}$/.test(value), path, '应为 YYYY-MM-DD');
  const parsed = new Date(`${value}T00:00:00Z`);
  requireValue(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, path, '日期不存在');
};
const uniqueId = (value, path, seen) => {
  text(value, path);
  requireValue(/^[a-z0-9][a-z0-9_-]*$/i.test(value), path, '仅支持字母、数字、短横线和下划线');
  requireValue(!seen.has(value), path, `重复 id ${value}`);
  seen.add(value);
};

// Validate once at the content boundary; components can rely on usable records.
// Unknown metadata is allowed so future content additions remain compatible.
export function validateContent(content) {
  object(content, 'content');
  requireValue(content.schemaVersion === 3, 'schemaVersion', '当前支持版本 3，游戏日期字段为 firstTime');
  if (content.demoMode !== undefined) requireValue(typeof content.demoMode === 'boolean', 'demoMode', '应为布尔值');
  array(content.avatars, 'avatars');
  content.avatars.forEach((avatar, i) => {
    object(avatar, `avatars[${i}]`);
    text(avatar.src, `avatars[${i}].src`);
    text(avatar.alt, `avatars[${i}].alt`);
  });
  array(content.games, 'games', true);
  const gameIds = new Set();
  content.games.forEach((game, i) => {
    const path = `games[${i}]`;
    object(game, path);
    uniqueId(game.id, `${path}.id`, gameIds);
    for (const field of ['title', 'character']) text(game[field], `${path}.${field}`);
    for (const field of ['platform', 'paper', 'ink']) if (game[field] !== undefined) text(game[field], `${path}.${field}`);
    if (game.englishTitle !== undefined) text(game.englishTitle, `${path}.englishTitle`);
    date(game.firstTime, `${path}.firstTime`);
    requireValue(game.hours === null || Number.isFinite(game.hours) && game.hours >= 0, `${path}.hours`, '应为非负数字，未知时填 null');
    if (game.layout !== undefined) requireValue(layouts.has(game.layout), `${path}.layout`, '不支持的布局');
    array(game.memories, `${path}.memories`);
    const memoryIds = new Set();
    game.memories.forEach((memory, j) => {
      const item = `${path}.memories[${j}]`;
      object(memory, item);
      uniqueId(memory.id, `${item}.id`, memoryIds);
      text(memory.title, `${item}.title`);
      if (memory.date !== undefined) date(memory.date, `${item}.date`);
      requireValue(types.has(memory.type), `${item}.type`, '不支持的回忆类型');
      if (memory.type === 'gallery') {
        array(memory.images, `${item}.images`, true);
        memory.images.forEach((image, k) => {
          object(image, `${item}.images[${k}]`);
          text(image.src, `${item}.images[${k}].src`);
          if (image.caption !== undefined) requireValue(typeof image.caption === 'string', `${item}.images[${k}].caption`, '应为文字');
        });
      } else if (memory.type === 'text') {
        text(memory.excerpt, `${item}.excerpt`);
        if (memory.paragraphs !== undefined) {
          array(memory.paragraphs, `${item}.paragraphs`);
          memory.paragraphs.forEach((paragraph, k) => text(paragraph, `${item}.paragraphs[${k}]`));
        }
      } else {
        text(memory.poster, `${item}.poster`);
        requireValue(memory.src === undefined || typeof memory.src === 'string', `${item}.src`, '应为路径、URL 或空字符串');
        if (memory.description !== undefined) requireValue(typeof memory.description === 'string', `${item}.description`, '应为文字');
        if (memory.previewSeconds !== undefined) requireValue(Number.isFinite(memory.previewSeconds) && memory.previewSeconds > 0, `${item}.previewSeconds`, '应为正数');
      }
    });
  });
  return content;
}

export function resolveMemoryLayout(game) {
  const sequence = layoutSequences[game.layout];
  return sequence && sequence.length === game.memories.length && sequence.every((type, i) => game.memories[i].type === type) ? game.layout : 'auto';
}

// Keep source JSON untouched; equal dates retain their original array order.
export function prepareContent(content) {
  validateContent(content);
  return {
    ...content,
    demoMode: content.demoMode ?? false,
    games: content.games.map(game => ({
      platform: 'Steam', paper: '#ede9f3', ink: '#7e6c96', layout: 'auto',
      ...game,
      memories: game.memories.map(memory => ({
        date: game.firstTime,
        ...memory,
        ...(memory.type === 'text' ? { paragraphs: memory.paragraphs ?? [] } : {}),
        ...(memory.type === 'gallery' ? { images: memory.images.map(image => ({ caption: '', ...image })) } : {})
      }))
    })).sort((a, b) => a.firstTime.localeCompare(b.firstTime))
  };
}
export async function loadContent(url, {
  signal,
  fetcher = fetch
} = {}) {
  const response = await fetcher(url, {
    signal
  });
  if (!response.ok) throw new Error(`content.json 加载失败（HTTP ${response.status}）`);
  const content = await response.json();
  // Also guard a cancellation that arrived while a custom response was parsing.
  signal?.throwIfAborted();
  return prepareContent(content);
}
export function contentAssetPaths(content) {
  return [...new Set([...content.avatars.map(avatar => avatar.src), ...content.games.flatMap(game => [game.character, ...game.memories.flatMap(memory => memory.type === 'gallery' ? memory.images.map(image => image.src) : memory.type === 'video' || memory.type === 'featuredVideo' ? [memory.poster, memory.src] : [])])].filter(Boolean))];
}
