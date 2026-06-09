import type { DayMeta } from './sheets';

export function weekWindow(dates: DayMeta[], now = new Date()): DayMeta[] {
  if (dates.length <= 7) return dates;
  const todayIso = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const todayIndex = dates.findIndex((date) => date.iso === todayIso);
  if (todayIndex < 0) return dates.slice(0, 7);
  const mondayOffset = (dates[todayIndex].dow + 6) % 7;
  return dates.slice(Math.max(0, todayIndex - mondayOffset), Math.max(0, todayIndex - mondayOffset) + 7);
}
