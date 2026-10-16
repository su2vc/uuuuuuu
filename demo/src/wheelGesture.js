// Keep all deliberate input, including slow motion after deceleration.
// Native touchpad momentum cannot be reliably separated from finger movement.
export function wheelDelta(event, pageHeight = 800) {
  if (event.ctrlKey || Math.abs(event.deltaX || 0) > Math.abs(event.deltaY)) return 0;
  const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? pageHeight : 1;
  const delta = event.deltaY * unit;
  return Number.isFinite(delta) ? delta : 0;
}
export const moveTimeline = (position, delta, spacing, count) => Math.max(0, Math.min(count - 1, position + delta / spacing));
