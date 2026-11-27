import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryDiaperRecordDto {
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

  /** 类型：1-小便 2-大便 3-混合 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  diaperType?: number;

  /** 小便量：1-少 2-中 3-多 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  urineAmount?: number;

  /** 小便颜色：1-清亮 2-浅黄 3-深黄 4-粉红/砖红 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  urineColor?: number;

  /** 大便颜色：1~6 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  stoolColor?: number;

  /** 大便性状：1~7 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  stoolTexture?: number;

  /** 更换时间范围（ISO 8601），命中 change_time 落在区间内的记录 */
  @IsOptional()
  @IsDateString({}, { message: '更换时间起始格式不正确' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: '更换时间截止格式不正确' })
  endTime?: string;

  /** 备注模糊匹配 */
  @IsOptional()
  @IsString()
  remark?: string;
}
