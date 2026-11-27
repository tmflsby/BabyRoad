/**
 * 育儿数据看板响应契约
 * 与前端 analysis.ts 的 BabyRecordAnalysisApi 类型一一对应，改动需两侧同步
 */

/* ---------- 枚举取值（与四张记录表的 tinyint 口径保持一致） ---------- */

/** 睡眠类型：1-小睡 2-夜睡 */
export type SleepTypeValue = 1 | 2;
/** 睡眠质量：1-好 2-一般 3-差，null 表示未评价 */
export type SleepQualityValue = 1 | 2 | 3;
/** 喂养类型：1-母乳 2-配方奶 3-混合 */
export type FeedTypeValue = 1 | 2 | 3;
/** 母乳侧：1-左 2-右 3-双侧 */
export type FeedSideValue = 1 | 2 | 3;
/** 尿布类型：1-小便 2-大便 3-混合 */
export type DiaperTypeValue = 1 | 2 | 3;
/** 小便量：1-少 2-中 3-多 */
export type UrineAmountValue = 1 | 2 | 3;
/** 大便颜色：1-清亮黄 2-绿 3-黑/墨绿 4-灰白 5-红/带血 6-其他 */
export type StoolColorValue = 1 | 2 | 3 | 4 | 5 | 6;
/** 大便性状：1-稀水样 2-糊状 3-成型软便 4-干硬颗粒 5-泡沫状 6-粘液状 7-其他 */
export type StoolTextureValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/* ---------- 1. 概览 ---------- */

export interface AnalysisOverviewFeeding {
  /** 区间内喂奶次数 */
  count: number;
  /** 总奶量(ml，1位小数)，无奶量记录时为 null */
  totalAmount: number | null;
  /** 总时长(分钟，整数)，无时长记录时为 null */
  totalDuration: number | null;
  /** 有奶量记录的均值(ml，1位小数) */
  avgAmount: number | null;
}

export interface AnalysisOverviewSleep {
  /** 区间内睡眠记录条数（含未醒） */
  count: number;
  /** 总时长(分钟，整数)，未醒记录不计入 */
  totalDuration: number | null;
  /** 有时长记录的平均时长(分钟，整数) */
  avgDuration: number | null;
  /** 未醒记录数，即 end_time IS NULL */
  unfinishedCount: number;
}

export interface AnalysisOverviewDiaper {
  count: number;
  urineCount: number;
  stoolCount: number;
  mixedCount: number;
}

export interface AnalysisOverviewGrowth {
  /** 区间内成长记录条数 */
  recordCount: number;
  /** 区间内最后一次测量日期，无记录为 null */
  latestRecordDate: string | null;
  /** 最新体重(kg，2位小数) */
  latestWeight: number | null;
  /** 最新身长(cm，1位小数) */
  latestHeight: number | null;
  /** 最新头围(cm，1位小数)，未测为 null */
  latestHeadCircumference: number | null;
  /** 区间内末次减首次体重，不足 2 条记录为 null */
  weightGain: number | null;
  /** 区间内末次减首次身长，不足 2 条记录为 null */
  heightGain: number | null;
}

export interface AnalysisOverview {
  feeding: AnalysisOverviewFeeding;
  sleep: AnalysisOverviewSleep;
  diaper: AnalysisOverviewDiaper;
  growth: AnalysisOverviewGrowth;
}

/* ---------- 2. 睡眠 ---------- */

export interface AnalysisSleepDaily {
  /** 分桶日期（按 start_time 的日期） */
  date: string;
  totalCount: number;
  nightCount: number;
  napCount: number;
  /** 夜睡时长合计(分钟)，当日夜睡均无时长时为 null */
  nightDuration: number | null;
  /** 小睡时长合计(分钟) */
  napDuration: number | null;
  /** 夜睡+小睡时长合计 */
  totalDuration: number | null;
  /** 当日有时长记录的平均时长(分钟) */
  avgDuration: number | null;
}

export interface AnalysisSleepQuality {
  /** null 表示未评价，前端单列一类展示 */
  quality: SleepQualityValue | null;
  count: number;
}

export interface AnalysisSleepResult {
  /** 稀疏返回：仅包含有数据的日期，缺失日期由前端补 0 */
  dailyList: AnalysisSleepDaily[];
  /** 稀疏返回：仅包含出现过的取值，按枚举值升序，null 排在末尾 */
  qualityList: AnalysisSleepQuality[];
}

/* ---------- 3. 喂养 ---------- */

export interface AnalysisFeedingDaily {
  /** 分桶日期（按 feed_time 的日期） */
  date: string;
  count: number;
  totalAmount: number | null;
  totalDuration: number | null;
  breastCount: number;
  formulaCount: number;
  mixedCount: number;
}

export interface AnalysisFeedingType {
  feedType: FeedTypeValue;
  count: number;
  totalAmount: number | null;
}

export interface AnalysisFeedingSide {
  side: FeedSideValue;
  count: number;
}

export interface AnalysisFeedingHour {
  /** 0-23 */
  hour: number;
  count: number;
  totalAmount: number | null;
}

export interface AnalysisFeedingResult {
  dailyList: AnalysisFeedingDaily[];
  typeList: AnalysisFeedingType[];
  /** 未记录母乳侧（如纯配方奶）的数据不参与分布 */
  sideList: AnalysisFeedingSide[];
  hourList: AnalysisFeedingHour[];
}

/* ---------- 4. 尿布 ---------- */

export interface AnalysisDiaperDaily {
  /** 分桶日期（按 change_time 的日期） */
  date: string;
  count: number;
  urineCount: number;
  stoolCount: number;
  mixedCount: number;
}

export interface AnalysisDiaperType {
  diaperType: DiaperTypeValue;
  count: number;
}

export interface AnalysisDiaperUrineAmount {
  /** null 表示未记录尿量 */
  urineAmount: UrineAmountValue | null;
  count: number;
}

export interface AnalysisDiaperStoolColor {
  /** null 表示未记录大便颜色 */
  stoolColor: StoolColorValue | null;
  count: number;
}

export interface AnalysisDiaperStoolTexture {
  /** null 表示未记录大便性状 */
  stoolTexture: StoolTextureValue | null;
  count: number;
}

export interface AnalysisDiaperResult {
  dailyList: AnalysisDiaperDaily[];
  typeList: AnalysisDiaperType[];
  urineAmountList: AnalysisDiaperUrineAmount[];
  stoolColorList: AnalysisDiaperStoolColor[];
  stoolTextureList: AnalysisDiaperStoolTexture[];
}

/* ---------- 5. 成长 ---------- */

export interface AnalysisGrowthPoint {
  recordDate: string;
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
  chestCircumference: number | null;
  weightPercentile: string | null;
  heightPercentile: string | null;
}

export interface AnalysisGrowthResult {
  /** 按 recordDate 升序，稀疏返回（无记录的日期不占位） */
  list: AnalysisGrowthPoint[];
}
