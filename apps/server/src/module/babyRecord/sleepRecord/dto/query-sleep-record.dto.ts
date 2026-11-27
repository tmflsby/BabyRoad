import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QuerySleepRecordDto {
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

  /** 睡眠类型：1-小睡 2-夜睡 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '睡眠类型必须为整数' })
  @Min(1, { message: '睡眠类型只能为 1 或 2' })
  @Max(2, { message: '睡眠类型只能为 1 或 2' })
  sleepType?: number;

  /** 睡眠质量：1-好 2-一般 3-差 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '睡眠质量必须为整数' })
  @Min(1, { message: '睡眠质量只能为 1、2 或 3' })
  @Max(3, { message: '睡眠质量只能为 1、2 或 3' })
  quality?: number;

  /** 入睡时间范围（ISO 8601），命中 start_time 落在区间内的记录 */
  @IsOptional()
  @IsDateString({}, { message: '入睡时间起始格式不正确' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: '入睡时间截止格式不正确' })
  endTime?: string;

  /** 备注模糊匹配 */
  @IsOptional()
  @IsString()
  remark?: string;
}
