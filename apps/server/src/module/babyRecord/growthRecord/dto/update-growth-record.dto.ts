import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateGrowthRecordDto {
  /** 记录日期（ISO 8601，如 2026-11-02） */
  @IsOptional()
  @IsDateString({}, { message: '记录日期格式不正确' })
  recordDate?: string;

  /** 体重kg：DECIMAL(5,2) */
  @IsOptional()
  @IsNumber({}, { message: '体重必须为数字' })
  @Min(0, { message: '体重不能为负数' })
  @Max(999.99, { message: '体重不能大于999.99' })
  weight?: number;

  /** 身长cm：DECIMAL(5,2) */
  @IsOptional()
  @IsNumber({}, { message: '身长必须为数字' })
  @Min(0, { message: '身长不能为负数' })
  @Max(999.99, { message: '身长不能大于999.99' })
  height?: number;

  /** 头围cm：传 null 表示清空 */
  @IsOptional()
  @IsNumber({}, { message: '头围必须为数字' })
  @Min(0, { message: '头围不能为负数' })
  @Max(999.99, { message: '头围不能大于999.99' })
  headCircumference?: number | null;

  /** 胸围cm：传 null 表示清空 */
  @IsOptional()
  @IsNumber({}, { message: '胸围必须为数字' })
  @Min(0, { message: '胸围不能为负数' })
  @Max(999.99, { message: '胸围不能大于999.99' })
  chestCircumference?: number | null;

  /** 体重百分位：传 null 表示清空 */
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '体重百分位长度不能超过20' })
  weightPercentile?: string | null;

  /** 身长百分位：传 null 表示清空 */
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '身长百分位长度不能超过20' })
  heightPercentile?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注长度不能超过500' })
  remark?: string;
}
