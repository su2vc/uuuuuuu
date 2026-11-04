import { parsePageHash } from '../shared/navigation.js';
import { pages } from './pageRegistry.js';

export function activePage(entry, hash, registry = pages) {
  const { pageId } = parsePageHash(hash);
  if (!entry || !pageId || entry.pageId !== pageId) return null;
  return registry.find(page => page.id === pageId) ?? null;
}
