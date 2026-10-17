import { asset } from './assets';
import { loadContent } from './content';
import { imagePreloadGroups, preloadImageGroups } from './imagePreloads.js';

let contentRequest;
let imageWarmup;

// Entry and album share the same validated JSON, including an in-flight request.
// Cancelling one consumer must not cancel the shared password-page warmup.
export async function loadAlbumContent({ signal } = {}) {
  signal?.throwIfAborted();
  if (!contentRequest) {
    contentRequest = loadContent(asset('content.json')).catch(error => {
      contentRequest = undefined;
      throw error;
    });
  }
  const content = await contentRequest;
  signal?.throwIfAborted();
  return content;
}

export function warmAlbumImages() {
  if (!imageWarmup) {
    imageWarmup = loadAlbumContent()
      .then(content => preloadImageGroups(imagePreloadGroups(content), asset))
      .catch(error => {
        imageWarmup = undefined;
        throw error;
      });
  }
  return imageWarmup;
}
