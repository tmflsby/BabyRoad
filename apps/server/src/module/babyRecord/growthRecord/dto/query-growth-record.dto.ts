import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryGrowthRecordDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须为整数' })
  @Min(1, { message: '页码不能小于1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页条数必须为整数' })
  @Min(1, { message: '每页条数不能小于1' })
  @Max(100, { message: '每页条数不能大于100' })
  pageSize?: number = 10;

  /** 记录日期范围（ISO 8601，如 2026-11-01），命中 record_date 落在区间内的记录 */
  @IsOptional()
  @IsDateString({}, { message: '记录日期起始格式不正确' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: '记录日期截止格式不正确' })
  endDate?: string;

  /** 备注模糊匹配 */
  @IsOptional()
  @IsString()
  remark?: string;
}
