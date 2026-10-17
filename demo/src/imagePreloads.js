import { openingPhotoPaths } from './openingPhotos.js';

export function imagePreloadGroups(content) {
  const first = content.games[0];
  const seen = new Set();
  const unique = paths => paths.filter(path => path && !seen.has(path) && seen.add(path));
  return [
    unique([
      first.character,
      ...content.avatars.map(avatar => avatar.src),
      ...first.memories.flatMap(memory => memory.type === 'gallery'
        ? memory.images.map(image => image.src)
        : memory.type === 'video' || memory.type === 'featuredVideo' ? [memory.poster] : []),
    ]),
    unique([
      content.games[1]?.character,
      ...openingPhotoPaths,
      ...content.games.slice(2).map(game => game.character),
    ]),
  ];
}

// Finish the first screen before warming navigation and opening textures.
// Keep the queue small so typing and the entry script do not compete with every image.
export async function preloadImageGroups(groups, resolve, ImageClass = Image) {
  for (const [groupIndex, paths] of groups.entries()) {
    let next = 0;
    const worker = async () => {
      while (next < paths.length) {
        const path = paths[next++];
        await new Promise(done => {
          const image = new ImageClass();
          image.decoding = 'async';
          image.fetchPriority = groupIndex === 0 ? 'high' : 'low';
          image.onload = image.onerror = done;
          image.src = resolve(path);
        });
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, paths.length) }, worker));
  }
}
