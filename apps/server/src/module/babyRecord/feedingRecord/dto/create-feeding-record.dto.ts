import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFeedingRecordDto {
  /** 喂奶时间（ISO 8601，如 2026-11-02T12:30:00） */
  @IsDateString({}, { message: '喂奶时间格式不正确' })
  feedTime: string;

  /** 类型：1-母乳 2-配方奶 3-混合 */
  @IsInt({ message: '喂奶类型必须为整数' })
  @Min(1, { message: '喂奶类型只能为 1、2 或 3' })
  @Max(3, { message: '喂奶类型只能为 1、2 或 3' })
  feedType: number;

  /** 母乳侧：1-左 2-右 3-双侧，可传 null 表示不记录 */
  @IsOptional()
  @IsInt({ message: '母乳侧必须为整数' })
  @Min(1, { message: '母乳侧只能为 1、2 或 3' })
  @Max(3, { message: '母乳侧只能为 1、2 或 3' })
  side?: number | null;

  /** 喂奶时长(分钟) */
  @IsOptional()
  @IsInt({ message: '喂奶时长必须为整数' })
  @Min(0, { message: '喂奶时长不能为负数' })
  @Max(1440, { message: '喂奶时长不能大于1440分钟' })
  duration?: number | null;

  /** 奶量ml：DECIMAL(6,1) */
  @IsOptional()
  @IsNumber({}, { message: '奶量必须为数字' })
  @Min(0, { message: '奶量不能为负数' })
  @Max(9999.9, { message: '奶量不能大于9999.9' })
  amount?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注长度不能超过500' })
  remark?: string;
}
