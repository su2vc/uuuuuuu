// Metadata can fetch sizeable byte ranges. Warm only clips near the album viewport.
export function observeVideoPreload(video, onNear, Observer = globalThis.IntersectionObserver) {
  if (!Observer) { onNear(); return () => {}; }
  let disposed = false;
  const observer = new Observer(entries => {
    if (disposed || !entries.some(entry => entry.isIntersecting)) return;
    onNear();
    disposed = true;
    observer.disconnect();
  }, { root: video.closest('.memories'), rootMargin: '240px 0px' });
  observer.observe(video);
  return () => { disposed = true; observer.disconnect(); };
}
