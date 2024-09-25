export async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}
export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function toMilliseconds(
  time: number,
  from: 'ms' | 'sec' | 'min' | 'hours' | 'days' = 'min',
): number {
  let res: number = time;
  switch (from) {
    case 'days':
      res *= 24;
    case 'hours':
      res *= 60;
    case 'min':
      res *= 60;
    case 'sec':
      res *= 1000;
      break;
    // case 'ms': res *= 1000; break;
  }
  return res;
}

export function fromMilliseconds(
  milliseconds: number,
  to: 'sec' | 'min' | 'hours' | 'days' = 'min',
): number {
  let res: number = milliseconds;
  switch (to) {
    case 'days':
      res *= 24;
    case 'hours':
      res /= 60;
    case 'min':
      res /= 60;
    case 'sec':
      res /= 1000;
      break;
    // case 'ms': res *= 1000; break;
  }
  return res;
}

export function dateToISO8601StringUTC(date: Date): string {
  return (
    date.getUTCFullYear() +
    '-' +
    (date.getUTCMonth() + 1).toString().padStart(2, '0') +
    '-' +
    date.getUTCDate().toString().padStart(2, '0') +
    ' ' +
    date.getUTCHours().toString().padStart(2, '0') +
    ':' +
    date.getUTCMinutes().toString().padStart(2, '0') +
    ':' +
    date.getUTCSeconds().toString().padStart(2, '0') +
    ':' +
    date.getUTCMilliseconds().toString().padStart(3, '0')
  );
}
