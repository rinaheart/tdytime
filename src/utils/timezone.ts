/**
 * Timezone Utility for TdyTime
 * App currently assumes single timezone; multi-TZ support is architecture-ready.
 */
export const formatTimeRange = (
  startTs: number,
  endTs: number,
  options: {
    locale?: string;
    timezone?: string;
    hour12?: boolean;
  } = {}
): string => {
  const { locale = 'vi-VN', timezone, hour12 = false } = options;
  const tz = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const fmt = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
    hour12,
  });
  
  return `${fmt.format(startTs)} - ${fmt.format(endTs)}`;
};
