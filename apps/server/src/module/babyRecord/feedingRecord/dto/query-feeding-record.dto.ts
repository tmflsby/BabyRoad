import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryFeedingRecordDto {
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

  /** 喂奶类型：1-母乳 2-配方奶 3-混合 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '喂奶类型必须为整数' })
  @Min(1, { message: '喂奶类型只能为 1、2 或 3' })
  @Max(3, { message: '喂奶类型只能为 1、2 或 3' })
  feedType?: number;

  /** 母乳侧：1-左 2-右 3-双侧 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '母乳侧必须为整数' })
  @Min(1, { message: '母乳侧只能为 1、2 或 3' })
  @Max(3, { message: '母乳侧只能为 1、2 或 3' })
  side?: number;

  /** 喂奶时间范围（ISO 8601），命中 feed_time 落在区间内的记录 */
  @IsOptional()
  @IsDateString({}, { message: '喂奶时间起始格式不正确' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: '喂奶时间截止格式不正确' })
  endTime?: string;

  /** 备注模糊匹配 */
  @IsOptional()
  @IsString()
  remark?: string;
}
