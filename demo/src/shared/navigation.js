// Hash routes support static hosts and GitHub project Pages without server rewrites.
// The first segment identifies the page; remaining segments belong to that page.
export function parsePageHash(hash) {
  if (typeof hash !== 'string' || !hash.startsWith('#/')) return { pageId: null, segments: [] };
  try {
    const [pageId, ...segments] = hash.slice(2).replace(/\/$/, '').split('/').map(decodeURIComponent);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageId)) return { pageId: null, segments: [] };
    return { pageId, segments };
  } catch {
    return { pageId: null, segments: [] };
  }
}

export function pageHash(pageId, segments = []) {
  if (typeof pageId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageId)) {
    throw new Error('无效的页面 id');
  }
  return `#/${[pageId, ...segments].map(encodeURIComponent).join('/')}`;
}
