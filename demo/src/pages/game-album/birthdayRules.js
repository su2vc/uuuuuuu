const birthdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit',
});

export const BIRTHDAY_TEST_MODE = false;

export function isBirthday(date = new Date()) {
  if (!Number.isFinite(date.getTime())) return false;
  const parts = birthdayFormatter.formatToParts(date);
  return parts.find(part => part.type === 'month')?.value === '10'
    && parts.find(part => part.type === 'day')?.value === '20';
}

export function shouldCelebrateBirthday(date = new Date(), { birthdayTestMode = BIRTHDAY_TEST_MODE } = {}) {
  return birthdayTestMode || isBirthday(date);
}
