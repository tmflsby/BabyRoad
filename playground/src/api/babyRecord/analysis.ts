import { requestClient } from '#/api/request';

/**
 * 育儿数据看板统计接口
 * 契约口径（与后端 AnalysisDateRangeDto 及各统计 Service 对齐）：
 * 1. 入参仅 startDate/endDate（YYYY-MM-DD，闭区间），后端开启 forbidNonWhitelisted，不得多传；
 * 2. 只统计 delFlag=0 的记录；
 * 3. 日期分桶字段：睡眠取 startTime、喂奶取 feedTime、尿布取 changeTime、成长取 recordDate；
 * 4. 日期序列与枚举分布均为稀疏返回（只返回有数据的项），补零/补全由前端完成；
 * 5. 数值无数据统一返回 null（前端展示 `-`），不以 0 冒充有效值；
 * 6. 单位：时长=分钟，奶量=ml，体重=kg，身长/头围/胸围=cm；
 * 7. 成长记录频率远低于其他三项，看板为成长趋势使用独立长区间，
 *    因此 overview 不返回 growth 块，成长概览指标由 /growth 的明细在前端派生。
 */
export namespace BabyRecordAnalysisApi {
  /** 统计接口通用查询参数 */
  export interface DateRangeParams {
    /** 结束日期(YYYY-MM-DD，闭区间) */
    endDate: string;
    /** 开始日期(YYYY-MM-DD，闭区间) */
    startDate: string;
  }

  /** 概览统计，对齐 GET /babyRecord/analysis/overview */
  export interface Overview {
    diaper: {
      /** 混合次数 */
      mixedCount: number;
      /** 大便次数 */
      stoolCount: number;
      /** 区间内更换总次数 */
      count: number;
      /** 小便次数 */
      urineCount: number;
    };
    feeding: {
      /** 有奶量记录的均值(ml)，无奶量记录时为 null */
      avgAmount: null | number;
      /** 区间内喂奶次数 */
      count: number;
      /** 区间内奶量合计(ml) */
      totalAmount: null | number;
      /** 区间内喂奶时长合计(分钟) */
      totalDuration: null | number;
    };
    sleep: {
      /** 单次平均时长(分钟)，未醒记录不计入 */
      avgDuration: null | number;
      /** 区间内睡眠记录次数 */
      count: number;
      /** 区间内睡眠时长合计(分钟)，未醒记录不计入 */
      totalDuration: null | number;
      /** 未醒(醒来时间为空)记录数 */
      unfinishedCount: number;
    };
  }

  /** 睡眠按日统计行 */
  export interface SleepDailyItem {
    /** 平均时长(分钟) */
    avgDuration: null | number;
    /** 日期(YYYY-MM-DD) */
    date: string;
    /** 当日记录总次数 */
    totalCount: number;
    /** 当日时长合计(分钟) */
    totalDuration: null | number;
    /** 夜睡次数(sleepType=2) */
    nightCount: number;
    /** 夜睡时长合计(分钟) */
    nightDuration: null | number;
    /** 小睡次数(sleepType=1) */
    napCount: number;
    /** 小睡时长合计(分钟) */
    napDuration: null | number;
  }

  /** 睡眠质量分布行，quality 为 null 表示未评价 */
  export interface SleepQualityItem {
    count: number;
    quality: null | number;
  }

  /** 睡眠统计，对齐 GET /babyRecord/analysis/sleep */
  export interface SleepStat {
    dailyList: SleepDailyItem[];
    qualityList: SleepQualityItem[];
  }

  /** 喂奶按日统计行 */
  export interface FeedingDailyItem {
    /** 日期(YYYY-MM-DD) */
    date: string;
    /** 当日喂奶次数 */
    count: number;
    /** 配方奶次数(feedType=2) */
    formulaCount: number;
    /** 混合次数(feedType=3) */
    mixedCount: number;
    /** 母乳次数(feedType=1) */
    breastCount: number;
    /** 当日奶量合计(ml) */
    totalAmount: null | number;
    /** 当日喂奶时长合计(分钟) */
    totalDuration: null | number;
  }

  /** 喂奶类型分布行 */
  export interface FeedingTypeItem {
    count: number;
    feedType: number;
    totalAmount: null | number;
  }

  /** 母乳侧分布行 */
  export interface FeedingSideItem {
    count: number;
    side: number;
  }

  /** 喂奶时段分布行(0-23) */
  export interface FeedingHourItem {
    count: number;
    hour: number;
    totalAmount: null | number;
  }

  /** 喂奶统计，对齐 GET /babyRecord/analysis/feeding */
  export interface FeedingStat {
    dailyList: FeedingDailyItem[];
    hourList: FeedingHourItem[];
    sideList: FeedingSideItem[];
    typeList: FeedingTypeItem[];
  }

  /** 尿布按日统计行 */
  export interface DiaperDailyItem {
    /** 当日更换总次数 */
    count: number;
    /** 日期(YYYY-MM-DD) */
    date: string;
    /** 混合次数(diaperType=3) */
    mixedCount: number;
    /** 大便次数(diaperType=2) */
    stoolCount: number;
    /** 小便次数(diaperType=1) */
    urineCount: number;
  }

  /** 枚举分布行，取值为 null 表示该维度未填写 */
  export interface DiaperEnumCountItem {
    count: number;
    diaperType?: null | number;
    stoolColor?: null | number;
    stoolTexture?: null | number;
    urineAmount?: null | number;
  }

  /** 尿布统计，对齐 GET /babyRecord/analysis/diaper */
  export interface DiaperStat {
    dailyList: DiaperDailyItem[];
    stoolColorList: DiaperEnumCountItem[];
    stoolTextureList: DiaperEnumCountItem[];
    typeList: DiaperEnumCountItem[];
    urineAmountList: DiaperEnumCountItem[];
  }

  /** 成长趋势行，对齐 GET /babyRecord/analysis/growth（按 recordDate 升序） */
  export interface GrowthItem {
    chestCircumference: null | number;
    headCircumference: null | number;
    height: null | number;
    heightPercentile: null | string;
    recordDate: string;
    weight: null | number;
    weightPercentile: null | string;
  }

  /** 成长统计包装 */
  export interface GrowthStat {
    list: GrowthItem[];
  }
}

/**
 * 概览统计（次数、合计、均值与净增）
 * @param params 统计区间
 */
async function getAnalysisOverview(
  params: BabyRecordAnalysisApi.DateRangeParams,
) {
  return requestClient.get<BabyRecordAnalysisApi.Overview>(
    '/babyRecord/analysis/overview',
    { params },
  );
}

/**
 * 睡眠统计（按日时长趋势 + 质量分布）
 * @param params 统计区间
 */
async function getSleepAnalysis(params: BabyRecordAnalysisApi.DateRangeParams) {
  return requestClient.get<BabyRecordAnalysisApi.SleepStat>(
    '/babyRecord/analysis/sleep',
    { params },
  );
}

/**
 * 喂奶统计（按日趋势 + 类型/侧别/时段分布）
 * @param params 统计区间
 */
async function getFeedingAnalysis(
  params: BabyRecordAnalysisApi.DateRangeParams,
) {
  return requestClient.get<BabyRecordAnalysisApi.FeedingStat>(
    '/babyRecord/analysis/feeding',
    { params },
  );
}

/**
 * 尿布统计（按日趋势 + 类型/小便量/大便颜色性状分布）
 * @param params 统计区间
 */
async function getDiaperAnalysis(
  params: BabyRecordAnalysisApi.DateRangeParams,
) {
  return requestClient.get<BabyRecordAnalysisApi.DiaperStat>(
    '/babyRecord/analysis/diaper',
    { params },
  );
}

/**
 * 成长趋势（区间内全部身高体重记录，按日期升序）
 * @param params 统计区间
 */
async function getGrowthAnalysis(
  params: BabyRecordAnalysisApi.DateRangeParams,
) {
  return requestClient.get<BabyRecordAnalysisApi.GrowthStat>(
    '/babyRecord/analysis/growth',
    { params },
  );
}

export {
  getAnalysisOverview,
  getDiaperAnalysis,
  getFeedingAnalysis,
  getGrowthAnalysis,
  getSleepAnalysis,
};
