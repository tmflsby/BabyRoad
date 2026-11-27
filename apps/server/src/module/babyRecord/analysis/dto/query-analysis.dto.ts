import { IsDateString } from 'class-validator';

/**
 * 数据看板通用查询参数：五个统计接口共用
 * 白名单仅 startDate/endDate，全局 forbidNonWhitelisted 下前端多传 page/pageSize 会被直接拒绝
 */
export class QueryAnalysisDto {
  /** 统计起始日期（闭区间左端，含当天），格式 YYYY-MM-DD */
  @IsDateString({}, { message: '开始日期不能为空且需为 YYYY-MM-DD 格式' })
  startDate: string;

  /** 统计截止日期（闭区间右端，含当天），格式 YYYY-MM-DD */
  @IsDateString({}, { message: '结束日期不能为空且需为 YYYY-MM-DD 格式' })
  endDate: string;
}
