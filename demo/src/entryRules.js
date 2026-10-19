const birthdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit'
});
// Enable only for an explicit birthday preview; production follows the Shanghai date.
export const BIRTHDAY_TEST_MODE = false;
// Temporary preview barrier: set false to restore the birthday / opening flow.
export const ENTRY_BLOCKED = false;
export function isBirthday(date = new Date()) {
  if (!Number.isFinite(date.getTime())) return false;
  const parts = birthdayFormatter.formatToParts(date);
  return parts.find(p => p.type === 'month')?.value === '10' && parts.find(p => p.type === 'day')?.value === '20';
}
// A static keepsake entrance, not server-side authentication.
export function entryDecision(password, date = new Date(), {
  birthdayTestMode = BIRTHDAY_TEST_MODE
} = {}) {
  const granted = password === '1020';
  return {
    granted,
    birthday: granted && (birthdayTestMode || isBirthday(date))
  };
}
