// One trackpad gesture advances one photo; a reverse gesture can respond immediately.
export function createPhotoWheelHandler(move, { now = () => performance.now() } = {}) {
  let lastTime = -Infinity;
  let direction = 0;
  let distance = 0;
  let advanced = false;
  return event => {
    if (event.ctrlKey || event.defaultPrevented || event.cancelable === false) return false;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!Number.isFinite(delta) || !delta) return false;
    const time = now();
    const nextDirection = Math.sign(delta);
    if (time - lastTime > 180 || direction !== nextDirection) {
      distance = 0;
      advanced = false;
    }
    lastTime = time;
    direction = nextDirection;
    event.preventDefault();
    event.stopPropagation();
    if (advanced) return true;
    distance += Math.abs(delta) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
    if (distance >= 40) {
      move(direction);
      advanced = true;
    }
    return true;
  };
}
