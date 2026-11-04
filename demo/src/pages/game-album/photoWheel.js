// Follow wheel distance continuously; there is no gesture lock or queued animation.
export function createPhotoWheelHandler(move, { now = () => performance.now() } = {}) {
  let lastTime = -Infinity;
  let direction = 0;
  let distance = 0;
  return event => {
    if (event.ctrlKey || event.defaultPrevented || event.cancelable === false) return false;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!Number.isFinite(delta) || !delta) return false;
    const time = now();
    const nextDirection = Math.sign(delta);
    if (time - lastTime > 180 || direction !== nextDirection) {
      distance = 0;
    }
    lastTime = time;
    direction = nextDirection;
    event.preventDefault();
    event.stopPropagation();
    distance += Math.abs(delta) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
    const steps = Math.floor(distance / 80);
    if (steps) {
      distance %= 80;
      move(direction * steps);
    }
    return true;
  };
}
