import type { Dayjs } from 'dayjs';

import type { ECOption } from '@vben/plugins/echarts';

import type { BabyRecordAnalysisApi } from '#/api';

import dayjs from 'dayjs';

import { $t } from '#/locales';

import {
  diaperTypeOptions,
  stoolColorOptions,
  stoolTextureOptions,
} from '../diaperRecord/data';
import { feedTypeOptions } from '../feedingRecord/data';
import { qualityOptions } from '../sleepRecord/data';
import { referenceSeries, WHO_MAX_AGE_MONTH } from './who-growth-standards';

/** 图表系列联合类型（ECOption.series 允许单值或数组，取数组元素类型） */
type ChartSeries = Extract<ECOption['series'], unknown[]>[number];

/** 成长趋势可切换指标 */
export type GrowthMetric = 'head' | 'height' | 'weight';

/** 成长趋势指标选项 */
export interface GrowthMetricOption {
  label: string;
  unit: string;
  value: GrowthMetric;
}

/** 区间快捷档（睡眠/喂奶/换尿布记录频率高，以短周期为主） */
export type RangePreset = '3' | '7' | '15' | '30' | 'custom';

/** 成长趋势独立快捷档（成长记录频次低，需更长跨度） */
export type GrowthRangePreset = '30' | '90' | '180';

/** 宝宝档案（仅看板本地记忆，不落库、不下发后端） */
export interface BabyProfile {
  /** 出生日期(YYYY-MM-DD)，未录入为空字符串 */
  birthday: string;
  /** 性别，未选择为空字符串 */
  sex: '' | 'boy' | 'girl';
}

/** 图表配色：沿用 vben 示例的柔和色系 */
const COLORS = {
  area: '#5ab1ef',
  blue: '#5ab1ef',
  green: '#019680',
  orange: '#ff9f7f',
  purple: '#9a60b4',
  red: '#e17b77',
  teal: '#66d2e7',
} as const;

const BABY_PROFILE_KEY = 'baby-analysis-profile';

/** 区间跨度上限（天），超出则提示并忽略本次选择，避免后端聚合压力过大 */
export const MAX_RANGE_DAYS = 366;

/** 空的宝宝档案 */
function emptyProfile(): BabyProfile {
  return { birthday: '', sex: '' };
}

/**
 * 读取本地记忆的宝宝档案；localStorage 不可用或数据损坏时回退为空，
 * 保证看板其余部分仍可正常渲染
 */
export function readBabyProfile(): BabyProfile {
  try {
    const raw = globalThis.localStorage?.getItem(BABY_PROFILE_KEY);
    if (!raw) {
      return emptyProfile();
    }
    const parsed = JSON.parse(raw) as Partial<BabyProfile>;
    return {
      birthday:
        typeof parsed.birthday === 'string' ? parsed.birthday.slice(0, 10) : '',
      sex: parsed.sex === 'boy' || parsed.sex === 'girl' ? parsed.sex : '',
    };
  } catch {
    return emptyProfile();
  }
}

/** 写入本地记忆的宝宝档案 */
export function writeBabyProfile(profile: BabyProfile) {
  try {
    globalThis.localStorage?.setItem(BABY_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // 隐私模式等场景写入失败不影响看板使用
  }
}

/**
 * 记录日期相对宝宝出生日期的月龄（小数，可能为负）
 * 未录入出生日期时返回 null
 */
export function ageInMonths(birthday: string, date: string): null | number {
  if (!birthday || !date) {
    return null;
  }
  const from = dayjs(birthday);
  const to = dayjs(date);
  if (!from.isValid() || !to.isValid()) {
    return null;
  }
  // 按日历天差换算月龄，避开夏令时与闰年带来的整月偏移
  return (to.diff(from, 'day', true) * 12) / 365.25;
}

/** 快捷档对应的区间（含当天） */
export function presetRange(days: number): [Dayjs, Dayjs] {
  return [dayjs().subtract(days - 1, 'day'), dayjs()];
}

/** 区间快捷档选项 */
export function rangePresetOptions(): {
  label: string;
  value: RangePreset;
}[] {
  return [
    { label: $t('babyRecord.analysis.last3'), value: '3' },
    { label: $t('babyRecord.analysis.last7'), value: '7' },
    { label: $t('babyRecord.analysis.last15'), value: '15' },
    { label: $t('babyRecord.analysis.last30'), value: '30' },
  ];
}

/** 成长趋势独立区间选项 */
export function growthRangePresetOptions(): {
  label: string;
  value: GrowthRangePreset;
}[] {
  return [
    { label: $t('babyRecord.analysis.last30'), value: '30' },
    { label: $t('babyRecord.analysis.last90'), value: '90' },
    { label: $t('babyRecord.analysis.last180'), value: '180' },
  ];
}

/** 成长概览派生指标（与成长趋势卡共用独立区间） */
export interface GrowthSummary {
  heightGain: null | number;
  latestHeadCircumference: null | number;
  latestHeight: null | number;
  latestRecordDate: null | string;
  latestWeight: null | number;
  recordCount: number;
  weightGain: null | number;
}

/** 成长行上可取末值的字段 */
type GrowthValueField = 'headCircumference' | 'height' | 'weight';

/** 取升序列表中该字段最后一个非空值 */
function lastValue(
  rows: BabyRecordAnalysisApi.GrowthItem[],
  field: GrowthValueField,
): null | number {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = rows[index]?.[field];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return null;
}

/** 取升序列表中该字段首个非空值 */
function firstValue(
  rows: BabyRecordAnalysisApi.GrowthItem[],
  field: GrowthValueField,
): null | number {
  for (const row of rows) {
    const value = row[field];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return null;
}

/** 区间净增值：首末非空值之差，不足两个值时为 null */
function gainOf(
  rows: BabyRecordAnalysisApi.GrowthItem[],
  field: GrowthValueField,
): null | number {
  const first = firstValue(rows, field);
  const last = lastValue(rows, field);
  return first === null || last === null
    ? null
    : Number((last - first).toFixed(2));
}

/**
 * 由成长趋势明细派生概览指标
 * 成长记录频率低，不能跟着顶部短区间走，否则概览成长块永远为空
 */
export function summarizeGrowth(
  list: BabyRecordAnalysisApi.GrowthItem[],
): GrowthSummary {
  // 不依赖后端排序，按记录日期升序自行对齐
  const rows = [...list].sort((a, b) =>
    a.recordDate.localeCompare(b.recordDate),
  );
  return {
    heightGain: gainOf(rows, 'height'),
    latestHeadCircumference: lastValue(rows, 'headCircumference'),
    latestHeight: lastValue(rows, 'height'),
    latestRecordDate: rows.at(-1)?.recordDate ?? null,
    latestWeight: lastValue(rows, 'weight'),
    recordCount: rows.length,
    weightGain: gainOf(rows, 'weight'),
  };
}

/** 成长趋势可切换指标 */
export function growthMetricOptions(): GrowthMetricOption[] {
  return [
    { label: $t('babyRecord.growth.weight'), unit: 'kg', value: 'weight' },
    { label: $t('babyRecord.growth.height'), unit: 'cm', value: 'height' },
    {
      label: $t('babyRecord.growth.headCircumference'),
      unit: 'cm',
      value: 'head',
    },
  ];
}

/** 分钟转小时（保留 1 位小数），空值按 0 计 */
export function toHours(minutes: null | number | undefined): number {
  return Math.round(((minutes ?? 0) / 60) * 10) / 10;
}

/** 数值/文本展示：空值返回 `-` */
export function orDash(value: null | number | string | undefined): string {
  return value === null || value === undefined || value === ''
    ? '-'
    : String(value);
}

/**
 * 补齐区间内的连续日期（YYYY-MM-DD）
 * 后端按稀疏日期返回，前端按区间补零后作类目轴
 */
export function buildDateAxis(startDate: string, endDate: string): string[] {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
    return [];
  }
  const axis: string[] = [];
  // 按日历天逐日递增（而非加 24 小时），避免夏令时导致缺日或重日
  for (
    let cursor = start;
    !cursor.isAfter(end);
    cursor = cursor.add(1, 'day')
  ) {
    axis.push(cursor.format('YYYY-MM-DD'));
  }
  return axis;
}

/** 类目轴标签用的 `MM-DD` */
function shortDate(date: string): string {
  return date.slice(5);
}

/** 按日期建立行索引 */
function byDate<T extends { date: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.date, row]));
}

/** 枚举取值在分布列表中的计数，缺省 0 */
function countOf<T extends { count: number }>(
  rows: T[],
  key: keyof T,
  value: null | number | undefined,
): number {
  const matched = rows.find(
    (row) => (row[key] as null | number | undefined) === value,
  );
  return matched?.count ?? 0;
}

/** 类目轴基础配置 */
function categoryAxis(labels: string[]) {
  return {
    axisLabel: { hideOverlap: true },
    axisTick: { alignWithLabel: true },
    data: labels,
    type: 'category' as const,
  };
}

const GRID = { bottom: 24, containLabel: true, left: 16, right: 16, top: 40 };

/** 次数类纵轴 */
function countAxis(name: string) {
  return { minInterval: 1, name, type: 'value' as const };
}

/** 饼图通用配置（0 值项不展示，避免空扇区挤占图例） */
function pieOption(
  data: { name: string; value: number }[],
  colors?: string[],
): ECOption {
  return {
    color: colors,
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        data: data.filter((item) => item.value > 0),
        label: { formatter: '{b}: {c}' },
        radius: ['40%', '65%'],
        type: 'pie',
      },
    ],
    tooltip: { formatter: '{b}: {c} ({d}%)', trigger: 'item' },
  };
}

/**
 * 柱线组合图的公共配置
 * xAxisLabels 直接是轴上展示的文本，日期轴由调用方先转成 MM-DD，
 * 避免在这里统一截字符串把非日期轴（如 0-23 时）截成空白
 */
function trendOption(params: {
  colors: string[];
  series: ChartSeries[];
  xAxisLabels: string[];
  yAxis: ECOption['yAxis'];
}): ECOption {
  return {
    color: params.colors,
    grid: GRID,
    legend: { top: 0 },
    series: params.series,
    tooltip: { axisPointer: { type: 'shadow' }, trigger: 'axis' },
    xAxis: categoryAxis(params.xAxisLabels),
    yAxis: params.yAxis,
  };
}

/**
 * 睡眠趋势：夜睡/小睡时长堆叠柱（小时）+ 每日记录次数折线
 */
export function buildSleepTrendOption(
  params: BabyRecordAnalysisApi.SleepStat,
  axis: string[],
): ECOption {
  const map = byDate(params.dailyList);
  const timesLabel = $t('babyRecord.analysis.times');
  return trendOption({
    colors: [COLORS.blue, COLORS.purple, COLORS.green],
    xAxisLabels: axis.map(shortDate),
    series: [
      {
        data: axis.map((date) => toHours(map.get(date)?.nightDuration)),
        name: $t('babyRecord.sleep.night'),
        stack: 'duration',
        type: 'bar',
      },
      {
        data: axis.map((date) => toHours(map.get(date)?.napDuration)),
        name: $t('babyRecord.sleep.nap'),
        stack: 'duration',
        type: 'bar',
      },
      {
        data: axis.map((date) => map.get(date)?.totalCount ?? 0),
        name: timesLabel,
        smooth: true,
        type: 'line',
        yAxisIndex: 1,
      },
    ],
    yAxis: [
      { name: $t('babyRecord.analysis.hours'), type: 'value' },
      countAxis(timesLabel),
    ],
  });
}

/**
 * 睡眠质量占比饼图
 * 未评价（后端 quality 为 null）单列一类，避免与「差」混淆
 */
export function buildSleepQualityOption(
  params: BabyRecordAnalysisApi.SleepStat,
): ECOption {
  const options = qualityOptions();
  const colorByValue: Record<number, string> = {
    1: COLORS.green,
    2: COLORS.orange,
    3: COLORS.red,
  };
  const data = [
    ...options.map((option) => ({
      name: option.label,
      value: countOf(params.qualityList, 'quality', option.value),
    })),
    {
      name: $t('babyRecord.analysis.unrated'),
      value: countOf(params.qualityList, 'quality', null),
    },
  ];
  return pieOption(data, [
    ...options.map((option) => colorByValue[option.value] ?? COLORS.blue),
    COLORS.area,
  ]);
}

/**
 * 喂奶趋势：每日奶量柱（ml）+ 次数折线
 */
export function buildFeedingTrendOption(
  params: BabyRecordAnalysisApi.FeedingStat,
  axis: string[],
): ECOption {
  const map = byDate(params.dailyList);
  const timesLabel = $t('babyRecord.analysis.times');
  return trendOption({
    colors: [COLORS.teal, COLORS.orange],
    xAxisLabels: axis.map(shortDate),
    series: [
      {
        data: axis.map((date) => map.get(date)?.totalAmount ?? 0),
        name: $t('babyRecord.feeding.amount'),
        type: 'bar',
      },
      {
        data: axis.map((date) => map.get(date)?.count ?? 0),
        name: timesLabel,
        smooth: true,
        type: 'line',
        yAxisIndex: 1,
      },
    ],
    yAxis: [{ name: 'ml', type: 'value' }, countAxis(timesLabel)],
  });
}

/** 喂养类型占比饼图 */
export function buildFeedingTypeOption(
  params: BabyRecordAnalysisApi.FeedingStat,
): ECOption {
  return pieOption(
    feedTypeOptions().map((option) => ({
      name: option.label,
      value: countOf(params.typeList, 'feedType', option.value),
    })),
  );
}

/**
 * 喂奶时段分布
 * X 轴为一天中的钟点（00:00-23:00，取 feedTime 的小时），每根柱子代表该小时内的喂奶次数
 */
export function buildFeedingHourOption(
  params: BabyRecordAnalysisApi.FeedingStat,
): ECOption {
  const labels = Array.from(
    { length: 24 },
    (_, hour) => `${String(hour).padStart(2, '0')}:00`,
  );
  const counts = labels.map(
    (_, hour) => params.hourList.find((item) => item.hour === hour)?.count ?? 0,
  );
  return {
    color: [COLORS.green],
    // 预留 X 轴名称的位置，否则轴名会与类目标签挤在一起
    grid: { ...GRID, bottom: 52 },
    legend: { top: 0 },
    series: [
      {
        data: counts,
        name: $t('babyRecord.analysis.times'),
        type: 'bar',
      },
    ],
    tooltip: { axisPointer: { type: 'shadow' }, trigger: 'axis' },
    xAxis: {
      ...categoryAxis(labels),
      name: $t('babyRecord.analysis.hourAxis'),
      nameGap: 26,
      nameLocation: 'middle',
    },
    yAxis: [countAxis($t('babyRecord.analysis.times'))],
  };
}

/**
 * 尿布趋势：小便/大便/混合每日次数堆叠柱
 */
export function buildDiaperTrendOption(
  params: BabyRecordAnalysisApi.DiaperStat,
  axis: string[],
): ECOption {
  const map = byDate(params.dailyList);
  const pick = (key: 'mixedCount' | 'stoolCount' | 'urineCount') =>
    axis.map((date) => map.get(date)?.[key] ?? 0);
  return trendOption({
    colors: [COLORS.teal, COLORS.orange, COLORS.purple],
    xAxisLabels: axis.map(shortDate),
    series: [
      {
        data: pick('urineCount'),
        name: $t('babyRecord.diaper.urine'),
        stack: 'count',
        type: 'bar',
      },
      {
        data: pick('stoolCount'),
        name: $t('babyRecord.diaper.stool'),
        stack: 'count',
        type: 'bar',
      },
      {
        data: pick('mixedCount'),
        name: $t('babyRecord.diaper.mixed'),
        stack: 'count',
        type: 'bar',
      },
    ],
    yAxis: [countAxis($t('babyRecord.analysis.times'))],
  });
}

/** 尿布类型占比饼图 */
export function buildDiaperTypeOption(
  params: BabyRecordAnalysisApi.DiaperStat,
): ECOption {
  return pieOption(
    diaperTypeOptions().map((option) => ({
      name: option.label,
      value: countOf(params.typeList, 'diaperType', option.value),
    })),
  );
}

/** 大便颜色/性状分布横向柱图（按计数升序，便于看差异） */
export function buildDiaperEnumBarOption(
  rows: BabyRecordAnalysisApi.DiaperEnumCountItem[],
  options: { label: string; value: number }[],
  key: 'stoolColor' | 'stoolTexture',
): ECOption {
  const sorted = [...rows].sort((a, b) => a.count - b.count);
  const labelOf = (value: null | number | undefined) =>
    options.find((option) => option.value === value)?.label ??
    $t('babyRecord.analysis.unfilled');
  return {
    color: [COLORS.blue],
    grid: { bottom: 16, containLabel: true, left: 16, right: 40, top: 20 },
    series: [
      {
        data: sorted.map((row) => row.count),
        label: { position: 'right', show: true },
        type: 'bar',
      },
    ],
    tooltip: { trigger: 'axis' },
    xAxis: { minInterval: 1, type: 'value' },
    yAxis: { data: sorted.map((row) => labelOf(row[key])), type: 'category' },
  };
}

/** 大便颜色分布 */
export function buildStoolColorOption(
  params: BabyRecordAnalysisApi.DiaperStat,
): ECOption {
  return buildDiaperEnumBarOption(
    params.stoolColorList,
    stoolColorOptions(),
    'stoolColor',
  );
}

/** 大便性状分布 */
export function buildStoolTextureOption(
  params: BabyRecordAnalysisApi.DiaperStat,
): ECOption {
  return buildDiaperEnumBarOption(
    params.stoolTextureList,
    stoolTextureOptions(),
    'stoolTexture',
  );
}

/** 成长记录的指标取值与月龄 */
interface GrowthPoint {
  age: null | number;
  date: string;
  value: null | number;
}

/** 指标名到成长记录字段的映射 */
const GROWTH_FIELD: Record<
  GrowthMetric,
  'headCircumference' | 'height' | 'weight'
> = {
  head: 'headCircumference',
  height: 'height',
  weight: 'weight',
};

/**
 * 成长趋势：录入出生日期与性别后 X 轴为月龄并叠加 WHO P3/P50/P97 参照带，
 * 未录入时退化为按记录日期的实测折线
 */
export function buildGrowthTrendOption(
  params: BabyRecordAnalysisApi.GrowthStat,
  metric: GrowthMetric,
  profile: BabyProfile,
): ECOption {
  const field = GROWTH_FIELD[metric];
  const points: GrowthPoint[] = params.list
    .map((row) => ({
      age: ageInMonths(profile.birthday, row.recordDate),
      date: row.recordDate,
      value: row[field],
    }))
    .filter((point) => point.value !== null && point.value !== undefined);

  // 头围无内置参照表；未录入档案时也只能画实测线
  const referenceMetric =
    profile.birthday && profile.sex && metric !== 'head' ? metric : null;
  const withReference = Boolean(referenceMetric) && Boolean(profile.sex);
  const series: ChartSeries[] = [];

  if (withReference && profile.sex && referenceMetric) {
    const p3 = referenceSeries(profile.sex, referenceMetric, 3);
    const p50 = referenceSeries(profile.sex, referenceMetric, 50);
    const p97 = referenceSeries(profile.sex, referenceMetric, 97);
    // 参照带用「P3 透明底线 + (P97-P3) 面积线同 stack」实现，只用已注册的折线能力
    const band = p97.map(([month, value], index) => [
      month,
      Number((value - (p3[index]?.[1] ?? value)).toFixed(2)),
    ]);
    series.push(
      {
        data: p3,
        lineStyle: { opacity: 0 },
        name: $t('babyRecord.analysis.referenceP3'),
        silent: true,
        stack: 'who',
        symbol: 'none',
        type: 'line',
        z: 1,
      },
      {
        areaStyle: { color: COLORS.area, opacity: 0.15 },
        data: band,
        lineStyle: { opacity: 0 },
        name: $t('babyRecord.analysis.referenceBand'),
        silent: true,
        stack: 'who',
        symbol: 'none',
        type: 'line',
        z: 1,
      },
      {
        data: p50,
        lineStyle: { color: COLORS.orange, type: 'dashed', width: 1 },
        name: $t('babyRecord.analysis.referenceP50'),
        symbol: 'none',
        type: 'line',
        z: 2,
      },
    );
  }

  series.push({
    connectNulls: true,
    data: withReference
      ? points.map((point) => [
          Number((point.age ?? 0).toFixed(2)),
          point.value as number,
        ])
      : points.map((point) => point.value as number),
    itemStyle: { color: COLORS.green },
    lineStyle: { color: COLORS.green },
    name: $t('babyRecord.analysis.actual'),
    smooth: true,
    symbolSize: 7,
    type: 'line',
    z: 5,
  });

  const unit =
    growthMetricOptions().find((item) => item.value === metric)?.unit ?? '';
  const maxAge = Math.max(
    0,
    ...points.map((point) => Math.ceil(point.age ?? 0)),
  );

  return {
    grid: GRID,
    legend: { top: 0 },
    series,
    tooltip: { trigger: 'axis' },
    xAxis: withReference
      ? {
          axisLabel: {
            formatter: `{value}${$t('babyRecord.analysis.monthUnit')}`,
          },
          max: Math.max(WHO_MAX_AGE_MONTH, maxAge),
          min: 0,
          name: $t('babyRecord.analysis.ageMonth'),
          splitLine: { lineStyle: { type: 'dashed' } },
          type: 'value',
        }
      : categoryAxis(points.map((point) => shortDate(point.date))),
    yAxis: [{ name: unit, scale: true, type: 'value' }],
  };
}
