import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSleepRecordDto {
  /** 入睡时间（ISO 8601），变更后会按新的入睡时间重算时长 */
  @IsOptional()
  @IsDateString({}, { message: '入睡时间格式不正确' })
  startTime?: string;

  /** 醒来时间：传 null 表示清除（回到“未醒”状态，时长同步置空） */
  @IsOptional()
  @IsDateString({}, { message: '醒来时间格式不正确' })
  endTime?: string | null;

  /** 睡眠质量：传 null 表示清空（可空字段直接使用 JSON 数字，不做字符串转换） */
  @IsOptional()
  @IsInt({ message: '睡眠质量必须为整数' })
  @Min(1, { message: '睡眠质量只能为 1、2 或 3' })
  @Max(3, { message: '睡眠质量只能为 1、2 或 3' })
  quality?: number | null;

  @IsOptional()
  @IsInt({ message: '睡眠类型必须为整数' })
  @Min(1, { message: '睡眠类型只能为 1 或 2' })
  @Max(2, { message: '睡眠类型只能为 1 或 2' })
  sleepType?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注长度不能超过500' })
  remark?: string;
}
