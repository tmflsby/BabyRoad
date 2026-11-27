import type { TagProps } from 'antdv-next';

import { formatDateTime as formatDateTimeText } from '@vben/utils';

import { $t } from '#/locales';

/** 枚举选项：同时满足 Select/RadioGroup 的 options 与 CellTag 的 options 结构 */
export interface EnumOption {
  color?: TagProps['color'];
  label: string;
  value: number;
}

/** 枚举项：value 为后端取值，key 为 babyRecord.<section>.<key> 的末段文案键 */
export interface EnumItem {
  key: string;
  value: number;
}

/**
 * 构造枚举选项：label 取 babyRecord.<section>.<key> 文案，
 * colors 按同一顺序声明表格 CellTag 的标签颜色（缺省则不带颜色），
 * 返回值可同时用于 Select/RadioGroup 的 options 与表格 cellRender 的 options
 */
export function useEnumOptions(
  section: string,
  items: EnumItem[],
  colors: TagProps['color'][] = [],
): EnumOption[] {
  return items.map((item, index) => ({
    color: colors[index],
    label: $t(`babyRecord.${section}.${item.key}`),
    value: item.value,
  }));
}

/**
 * 分钟数格式化为 `Xh Ym` 样式文案（空值返回 `-`）
 * 睡眠时长、喂奶时长等由后端计算或可选填写的字段统一使用
 */
export function formatDuration(minutes: null | number | undefined): string {
  if (minutes === null || minutes === undefined) {
    return '-';
  }
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (hour === 0) {
    return `${minute}${$t('babyRecord.common.minute')}`;
  }
  if (minute === 0) {
    return `${hour}${$t('babyRecord.common.hour')}`;
  }
  return `${hour}${$t('babyRecord.common.hour')}${minute}${$t('babyRecord.common.minute')}`;
}

/**
 * 数值 + 单位展示（空值返回 `-`），用于奶量、体重等带单位的字段
 */
export function formatWithUnit(
  value: null | number | undefined,
  unit: string,
): string {
  return value === null || value === undefined ? '-' : `${value} ${unit}`;
}

/**
 * 日期时间格式化为 `YYYY-MM-DD HH:mm:ss`（空值返回 `-`），
 * 用于醒来时间等后端可能返回 null 的时间字段，与表格 `formatDateTime` 展示口径一致
 */
export function formatDateTime(
  value: null | number | string | undefined,
): string {
  return value === null || value === undefined || value === ''
    ? '-'
    : formatDateTimeText(value);
}
