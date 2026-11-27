import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { SleepRecord } from '../sleepRecord/entities/sleep-record.entity';
import { FeedingRecord } from '../feedingRecord/entities/feeding-record.entity';
import { DiaperRecord } from '../diaperRecord/entities/diaper-record.entity';
import { GrowthRecord } from '../growthRecord/entities/growth-record.entity';
import { QueryAnalysisDto } from './dto/query-analysis.dto';
import {
  averageOrNull,
  bucketBy,
  countByValue,
  dateKey,
  groupByEnum,
  resolveRange,
  CM_DIGITS,
  KG_DIGITS,
  MINUTE_DIGITS,
  ML_DIGITS,
  roundOrNull,
  sumOrNull,
} from './analysis.helper';
import type { AnalysisDateRange } from './analysis.helper';
import type {
  AnalysisDiaperResult,
  AnalysisDiaperType,
  AnalysisFeedingResult,
  AnalysisFeedingHour,
  AnalysisFeedingSide,
  AnalysisFeedingType,
  AnalysisGrowthResult,
  AnalysisOverview,
  AnalysisOverviewGrowth,
  AnalysisSleepResult,
  FeedSideValue,
  FeedTypeValue,
  DiaperTypeValue,
  SleepQualityValue,
  StoolColorValue,
  StoolTextureValue,
  UrineAmountValue,
} from './interfaces/analysis.interface';

/**
 * 统计用到的记录列，未选取列运行时为 undefined，
 * 用 Pick 收窄类型以标明实际可用字段
 */
type SleepStatRow = Pick<
  SleepRecord,
  'startTime' | 'endTime' | 'duration' | 'sleepType' | 'quality'
>;
type FeedingStatRow = Pick<
  FeedingRecord,
  'feedTime' | 'feedType' | 'side' | 'duration' | 'amount'
>;
type DiaperStatRow = Pick<
  DiaperRecord,
  'changeTime' | 'diaperType' | 'urineAmount' | 'stoolColor' | 'stoolTexture'
>;
type GrowthStatRow = Pick<
  GrowthRecord,
  | 'recordDate'
  | 'weight'
  | 'height'
  | 'headCircumference'
  | 'chestCircumference'
  | 'weightPercentile'
  | 'heightPercentile'
>;

/**
 * 育儿数据看板统计服务
 * 聚合口径全部放在应用层完成：DATETIME 列由 TypeORM 还原为本地 Date，分桶日期与写入、
 * 列表页展示同源，可避开 SQL 时区与 DECIMAL 字符串带来的口径漂移；
 * 育儿记录为单宝宝数据且区间跨度上限 365 天，量级可控
 */
@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(SleepRecord)
    private readonly sleepRecordRepository: Repository<SleepRecord>,
    @InjectRepository(FeedingRecord)
    private readonly feedingRecordRepository: Repository<FeedingRecord>,
    @InjectRepository(DiaperRecord)
    private readonly diaperRecordRepository: Repository<DiaperRecord>,
    @InjectRepository(GrowthRecord)
    private readonly growthRecordRepository: Repository<GrowthRecord>,
  ) {}

  /**
   * 概览：四个模块各自的关键汇总值
   * 睡眠时长只累计已醒记录（未醒时 duration 为 NULL），奶量均值只统计有奶量的记录，
   * 成长增量取区间内末次与首次记录之差，不足 2 条返回 null
   */
  async overview(query: QueryAnalysisDto): Promise<AnalysisOverview> {
    const range = resolveRange(query);
    const [sleeps, feedings, diapers, growths] = await Promise.all([
      this.findSleeps(range),
      this.findFeedings(range),
      this.findDiapers(range),
      this.findGrowths(range),
    ]);

    const sleepDurations = sleeps.map((row) => row.duration);
    const feedAmounts = feedings.map((row) => row.amount);
    const diaperTypes = diapers.map((row) => row.diaperType);

    return {
      feeding: {
        count: feedings.length,
        totalAmount: roundOrNull(sumOrNull(feedAmounts), ML_DIGITS),
        totalDuration: sumOrNull(feedings.map((row) => row.duration)),
        avgAmount: roundOrNull(averageOrNull(feedAmounts), ML_DIGITS),
      },
      sleep: {
        count: sleeps.length,
        totalDuration: sumOrNull(sleepDurations),
        avgDuration: roundOrNull(averageOrNull(sleepDurations), MINUTE_DIGITS),
        unfinishedCount: sleeps.filter((row) => row.endTime === null).length,
      },
      diaper: {
        count: diapers.length,
        urineCount: countByValue(diaperTypes, 1),
        stoolCount: countByValue(diaperTypes, 2),
        mixedCount: countByValue(diaperTypes, 3),
      },
      growth: this.buildGrowthOverview(growths),
    };
  }

  /**
   * 睡眠统计：按 start_time 日期分桶给出夜睡/小睡时长与次数，并给出睡眠质量分布（含未评价档）
   */
  async sleep(query: QueryAnalysisDto): Promise<AnalysisSleepResult> {
    const range = resolveRange(query);
    const rows = await this.findSleeps(range);

    const dailyList = bucketBy(rows, (row) => dateKey(row.startTime)).map(
      ([date, list]) => {
        const nightList = list.filter((row) => row.sleepType === 2);
        const napList = list.filter((row) => row.sleepType === 1);
        const nightDuration = sumOrNull(nightList.map((row) => row.duration));
        const napDuration = sumOrNull(napList.map((row) => row.duration));

        return {
          date,
          totalCount: list.length,
          nightCount: nightList.length,
          napCount: napList.length,
          nightDuration,
          napDuration,
          // 总时长为夜睡与小睡之和，两者都无时长（当日全部未醒）时返回 null
          totalDuration:
            nightDuration === null && napDuration === null
              ? null
              : (nightDuration ?? 0) + (napDuration ?? 0),
          // 平均时长按有时长的记录取均值，未醒记录不拉低均值
          avgDuration: roundOrNull(
            averageOrNull(list.map((row) => row.duration)),
            MINUTE_DIGITS,
          ),
        };
      },
    );

    const qualityList = groupByEnum(
      rows,
      (row) => row.quality as SleepQualityValue | null,
    ).map((group) => ({ quality: group.value, count: group.rows.length }));

    return { dailyList, qualityList };
  }

  /**
   * 喂养统计：按 feed_time 日期分桶给出奶量/时长/类型次数，
   * 另附类型分布（含各类型奶量）、母乳侧分布与 24 小时时段分布
   */
  async feeding(query: QueryAnalysisDto): Promise<AnalysisFeedingResult> {
    const range = resolveRange(query);
    const rows = await this.findFeedings(range);

    const dailyList = bucketBy(rows, (row) => dateKey(row.feedTime)).map(
      ([date, list]) => {
        const feedTypes = list.map((row) => row.feedType);

        return {
          date,
          count: list.length,
          totalAmount: roundOrNull(
            sumOrNull(list.map((row) => row.amount)),
            ML_DIGITS,
          ),
          totalDuration: sumOrNull(list.map((row) => row.duration)),
          breastCount: countByValue(feedTypes, 1),
          formulaCount: countByValue(feedTypes, 2),
          mixedCount: countByValue(feedTypes, 3),
        };
      },
    );

    const typeList: AnalysisFeedingType[] = [];
    groupByEnum(rows, (row) => row.feedType as FeedTypeValue).forEach(
      (group) => {
        // feed_type 列非空，null 档仅作防御性跳过
        if (group.value === null) {
          return;
        }
        typeList.push({
          feedType: group.value,
          count: group.rows.length,
          totalAmount: roundOrNull(
            sumOrNull(group.rows.map((row) => row.amount)),
            ML_DIGITS,
          ),
        });
      },
    );

    const sideList: AnalysisFeedingSide[] = [];
    groupByEnum(rows, (row) => row.side as FeedSideValue | null).forEach(
      (group) => {
        // 未记录母乳侧（配方奶等）不参与侧别分布，契约中 sideList 不含 null 档
        if (group.value === null) {
          return;
        }
        sideList.push({ side: group.value, count: group.rows.length });
      },
    );

    const hourList: AnalysisFeedingHour[] = [];
    groupByEnum(rows, (row) => row.feedTime.getHours()).forEach((group) => {
      if (group.value === null) {
        return;
      }
      hourList.push({
        hour: group.value,
        count: group.rows.length,
        totalAmount: roundOrNull(
          sumOrNull(group.rows.map((row) => row.amount)),
          ML_DIGITS,
        ),
      });
    });

    return { dailyList, typeList, sideList, hourList };
  }

  /**
   * 尿布统计：按 change_time 日期分桶给出各类型次数，
   * 并附类型分布与尿量、大便颜色、大便性状分布（均保留未记录 null 档）
   */
  async diaper(query: QueryAnalysisDto): Promise<AnalysisDiaperResult> {
    const range = resolveRange(query);
    const rows = await this.findDiapers(range);

    const dailyList = bucketBy(rows, (row) => dateKey(row.changeTime)).map(
      ([date, list]) => {
        const diaperTypes = list.map((row) => row.diaperType);

        return {
          date,
          count: list.length,
          urineCount: countByValue(diaperTypes, 1),
          stoolCount: countByValue(diaperTypes, 2),
          mixedCount: countByValue(diaperTypes, 3),
        };
      },
    );

    const typeList: AnalysisDiaperType[] = [];
    groupByEnum(rows, (row) => row.diaperType as DiaperTypeValue).forEach(
      (group) => {
        // diaper_type 列非空，null 档仅作防御性跳过
        if (group.value === null) {
          return;
        }
        typeList.push({ diaperType: group.value, count: group.rows.length });
      },
    );

    const urineAmountList = groupByEnum(
      rows,
      (row) => row.urineAmount as UrineAmountValue | null,
    ).map((group) => ({ urineAmount: group.value, count: group.rows.length }));

    const stoolColorList = groupByEnum(
      rows,
      (row) => row.stoolColor as StoolColorValue | null,
    ).map((group) => ({ stoolColor: group.value, count: group.rows.length }));

    const stoolTextureList = groupByEnum(
      rows,
      (row) => row.stoolTexture as StoolTextureValue | null,
    ).map((group) => ({
      stoolTexture: group.value,
      count: group.rows.length,
    }));

    return {
      dailyList,
      typeList,
      urineAmountList,
      stoolColorList,
      stoolTextureList,
    };
  }

  /**
   * 成长统计：区间内测量记录按 recordDate 升序返回，稀疏给出，
   * 月龄与 WHO 参照带由前端依据出生日期/性别推算，后端不参与
   */
  async growth(query: QueryAnalysisDto): Promise<AnalysisGrowthResult> {
    const range = resolveRange(query);
    const rows = await this.findGrowths(range);

    return {
      list: rows.map((row) => ({
        recordDate: row.recordDate,
        weight: roundOrNull(row.weight, KG_DIGITS),
        height: roundOrNull(row.height, CM_DIGITS),
        headCircumference: roundOrNull(row.headCircumference, CM_DIGITS),
        chestCircumference: roundOrNull(row.chestCircumference, CM_DIGITS),
        weightPercentile: row.weightPercentile,
        heightPercentile: row.heightPercentile,
      })),
    };
  }

  /** 区间内未删除的睡眠记录，仅取统计所需列，按入睡时间升序 */
  private findSleeps(range: AnalysisDateRange): Promise<SleepStatRow[]> {
    return this.sleepRecordRepository.find({
      where: { delFlag: 0, startTime: Between(range.startAt, range.endAt) },
      select: {
        startTime: true,
        endTime: true,
        duration: true,
        sleepType: true,
        quality: true,
      },
      order: { startTime: 'ASC', id: 'ASC' },
    });
  }

  /** 区间内未删除的喂奶记录，仅取统计所需列，按喂奶时间升序 */
  private findFeedings(range: AnalysisDateRange): Promise<FeedingStatRow[]> {
    return this.feedingRecordRepository.find({
      where: { delFlag: 0, feedTime: Between(range.startAt, range.endAt) },
      select: {
        feedTime: true,
        feedType: true,
        side: true,
        duration: true,
        amount: true,
      },
      order: { feedTime: 'ASC', id: 'ASC' },
    });
  }

  /** 区间内未删除的尿布记录，仅取统计所需列，按更换时间升序 */
  private findDiapers(range: AnalysisDateRange): Promise<DiaperStatRow[]> {
    return this.diaperRecordRepository.find({
      where: { delFlag: 0, changeTime: Between(range.startAt, range.endAt) },
      select: {
        changeTime: true,
        diaperType: true,
        urineAmount: true,
        stoolColor: true,
        stoolTexture: true,
      },
      order: { changeTime: 'ASC', id: 'ASC' },
    });
  }

  /** 区间内未删除的成长记录，DATE 列按日期串比较，按记录日期升序 */
  private findGrowths(range: AnalysisDateRange): Promise<GrowthStatRow[]> {
    return this.growthRecordRepository.find({
      where: {
        delFlag: 0,
        recordDate: Between(range.startDate, range.endDate),
      },
      select: {
        recordDate: true,
        weight: true,
        height: true,
        headCircumference: true,
        chestCircumference: true,
        weightPercentile: true,
        heightPercentile: true,
      },
      order: { recordDate: 'ASC', id: 'ASC' },
    });
  }

  /** 概览中的成长部分：末次记录给出最新值，末次减首次给出区间增量 */
  private buildGrowthOverview(
    growths: GrowthStatRow[],
  ): AnalysisOverviewGrowth {
    const latest = growths.at(-1);
    const earliest = growths.at(0);
    // 区间内首末为同一条记录（不足 2 条）时无法计算增长量
    const baseline =
      latest && earliest && latest !== earliest ? { latest, earliest } : null;

    return {
      recordCount: growths.length,
      latestRecordDate: latest?.recordDate ?? null,
      latestWeight: latest ? roundOrNull(latest.weight, KG_DIGITS) : null,
      latestHeight: latest ? roundOrNull(latest.height, CM_DIGITS) : null,
      latestHeadCircumference: latest
        ? roundOrNull(latest.headCircumference, CM_DIGITS)
        : null,
      weightGain: baseline
        ? roundOrNull(
            baseline.latest.weight - baseline.earliest.weight,
            KG_DIGITS,
          )
        : null,
      heightGain: baseline
        ? roundOrNull(
            baseline.latest.height - baseline.earliest.height,
            CM_DIGITS,
          )
        : null,
    };
  }
}
