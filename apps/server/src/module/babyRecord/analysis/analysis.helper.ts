import { BadRequestException } from '@nestjs/common';
import type { QueryAnalysisDto } from './dto/query-analysis.dto';

/** 统计区间跨度上限（天），与前端快捷档/RangePicker 的约束保持一致 */
export const MAX_ANALYSIS_SPAN_DAYS = 365;

/** 契约精度：时长=分钟(整数)、奶量=ml(1位小数)、体重=kg(2位小数)、身长/头围/胸围=cm(1位小数) */
export const MINUTE_DIGITS = 0;
export const ML_DIGITS = 1;
export const KG_DIGITS = 2;
export const CM_DIGITS = 1;

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

/** 归一化后的统计区间，同时给出 DATE 列用的日期串与 DATETIME 列用的时刻边界 */
export interface AnalysisDateRange {
  /** 起始日期 YYYY-MM-DD，用于 DATE 列（如 growth_record.record_date）比较 */
  startDate: string;
  /** 截止日期 YYYY-MM-DD，用于 DATE 列比较 */
  endDate: string;
  /** startDate 00:00:00.000（本地时区），DATETIME 列闭区间左端 */
  startAt: Date;
  /** endDate 23:59:59.999（本地时区），DATETIME 列闭区间右端，确保覆盖截止日全天 */
  endAt: Date;
}

/** 统一截取为 YYYY-MM-DD，兼容前端误传带时间的 ISO 串 */
export function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/**
 * 校验并归一化统计区间：起止日期均为闭区间且起始不晚于截止，跨度不超过 MAX_ANALYSIS_SPAN_DAYS
 */
export function resolveRange(query: QueryAnalysisDto): AnalysisDateRange {
  const startDate = toDateOnly(query.startDate);
  const endDate = toDateOnly(query.endDate);

  if (startDate > endDate) {
    throw new BadRequestException('开始日期不能晚于结束日期');
  }

  // 补时间部分避免 'YYYY-MM-DD' 被按 UTC 解析产生时区偏移，与写入时的本地时间口径一致
  const startAt = new Date(`${startDate}T00:00:00`);
  const endAt = new Date(`${endDate}T23:59:59.999`);

  const spanDays =
    Math.floor((endAt.getTime() - startAt.getTime()) / MILLIS_PER_DAY) + 1;
  if (spanDays > MAX_ANALYSIS_SPAN_DAYS) {
    throw new BadRequestException(
      `统计区间跨度不能超过${MAX_ANALYSIS_SPAN_DAYS}天`,
    );
  }

  return { startDate, endDate, startAt, endAt };
}

/** 取本地日期键 YYYY-MM-DD：DATETIME 列由 TypeORM 还原为本地 Date，与列表页展示口径一致 */
export function dateKey(value: Date): string {
  const year = String(value.getFullYear()).padStart(4, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 四舍五入到指定小数位，负值按绝对值同向取整保证语义对称 */
export function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  const scaled = value * factor;
  const rounded =
    scaled < 0 ? -Math.round(-scaled) : Math.round(scaled + Number.EPSILON);
  return rounded / factor;
}

/** 可空版四舍五入：无数据（null/undefined/NaN）一律返回 null，不用 0 冒充有效值 */
export function roundOrNull(
  value: number | null | undefined,
  digits: number,
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return round(value, digits);
}

/** 求和：忽略空值样本，全部为空或无记录时返回 null */
export function sumOrNull(
  values: readonly (number | null | undefined)[],
): number | null {
  let total: number | null = null;
  values.forEach((value) => {
    if (value === null || value === undefined) {
      return;
    }
    total = (total ?? 0) + value;
  });
  return total;
}

/** 均值：仅统计非空样本，无有效样本时返回 null */
export function averageOrNull(
  values: readonly (number | null | undefined)[],
): number | null {
  const total = sumOrNull(values);
  const sampleCount = values.filter(
    (value) => value !== null && value !== undefined,
  ).length;
  if (total === null || sampleCount === 0) {
    return null;
  }
  return total / sampleCount;
}

/** 按日期分桶（稀疏返回，仅含有数据的日期），结果按日期键升序 */
export function bucketBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  rows.forEach((row) => {
    const key = keyOf(row);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      map.set(key, [row]);
    }
  });
  return [...map.entries()].sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

/** 枚举比较：未填(null)单列一档并排在末尾，其余按取值升序 */
function compareEnumKey(left: number | null, right: number | null): number {
  if (left === null) {
    return right === null ? 0 : 1;
  }
  if (right === null) {
    return -1;
  }
  return left - right;
}

/** 按枚举取值分组（稀疏返回，仅含出现过的取值），null 归为「未填」一档并排在末尾 */
export function groupByEnum<T extends object, E extends number>(
  rows: readonly T[],
  valueOf: (row: T) => E | null,
): Array<{ value: E | null; rows: T[] }> {
  const map = new Map<E | null, T[]>();
  rows.forEach((row) => {
    const key = valueOf(row);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      map.set(key, [row]);
    }
  });
  return [...map.entries()]
    .sort(([left], [right]) => compareEnumKey(left, right))
    .map(([value, bucket]) => ({ value, rows: bucket }));
}

/** 统计枚举取值出现次数：用于堆叠柱中「小便/大便/混合」「母乳/配方奶/混合」等分档计数 */
export function countByValue<T>(
  values: readonly (T | null)[],
  target: T,
): number {
  return values.filter((value) => value === target).length;
}
