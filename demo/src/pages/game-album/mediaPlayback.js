export function pauseOtherVideos(current, videos = current.ownerDocument.querySelectorAll('video')) {
  for (const video of videos) {
    if (video !== current && !video.paused) video.pause();
  }
}
