export interface TimezoneOption {
  label: string;
  value: string;
}

/**
 * 系统支持的时区列表
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { label: 'America/New_York (GMT-5)', value: 'America/New_York' },
  { label: 'Europe/London (GMT+0)', value: 'Europe/London' },
  { label: 'Asia/Shanghai (GMT+8)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (GMT+9)', value: 'Asia/Tokyo' },
  { label: 'Asia/Seoul (GMT+9)', value: 'Asia/Seoul' },
];
