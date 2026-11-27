import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSleepRecordDto {
  /** 入睡时间（ISO 8601，如 2026-11-02T20:30:00） */
  @IsDateString({}, { message: '入睡时间格式不正确' })
  startTime: string;

  /** 醒来时间，未醒可不传或传 null；传入后由应用层计算时长 */
  @IsOptional()
  @IsDateString({}, { message: '醒来时间格式不正确' })
  endTime?: string | null;

  /** 睡眠质量：1-好 2-一般 3-差，可传 null 表示未评价（时长 duration 由醒来时间自动计算，不开放入参） */
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
