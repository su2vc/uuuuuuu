import { pages } from '../app/pageRegistry.js';

// A static experience selector, not server-side authentication.
export function entryDecision(password, registry = pages) {
  const page = registry.find(candidate => candidate.password === password);
  return { granted: Boolean(page), pageId: page?.id ?? null };
}
