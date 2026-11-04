// Weekly reports establish a coverage range, not exact first/last play dates.
export function formatPlayPeriod(period, { includeYear = false } = {}) {
  if (!period) return '时间待补充';
  const compact = value => value.slice(5).split('-').map(Number).join('.');
  const full = value => `${value.slice(0, 4)}.${compact(value)}`;
  const crossYear = period.start.slice(0, 4) !== period.end.slice(0, 4);
  const start = includeYear || crossYear ? full(period.start) : compact(period.start);
  if (period.start === period.end) return start;
  const end = crossYear ? full(period.end) : compact(period.end);
  // Cross-year ranges always show both years to avoid an ambiguous chronology.
  return `${start}–${end}`;
}
