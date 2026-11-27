import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDiaperRecordDto {
  /** 更换时间（ISO 8601，如 2026-11-02T09:15:00） */
  @IsDateString({}, { message: '更换时间格式不正确' })
  changeTime: string;

  /** 类型：1-小便 2-大便 3-混合 */
  @IsInt({ message: '尿布类型必须为整数' })
  @Min(1, { message: '尿布类型只能为 1、2 或 3' })
  @Max(3, { message: '尿布类型只能为 1、2 或 3' })
  diaperType: number;

  /** 小便量：1-少(微湿) 2-中(半满) 3-多(沉甸甸) */
  @IsOptional()
  @IsInt({ message: '小便量必须为整数' })
  @Min(1, { message: '小便量只能为 1、2 或 3' })
  @Max(3, { message: '小便量只能为 1、2 或 3' })
  urineAmount?: number | null;

  /** 小便颜色：1-清亮 2-浅黄 3-深黄 4-粉红/砖红(结晶) */
  @IsOptional()
  @IsInt({ message: '小便颜色必须为整数' })
  @Min(1, { message: '小便颜色只能为 1 至 4' })
  @Max(4, { message: '小便颜色只能为 1 至 4' })
  urineColor?: number | null;

  /** 大便颜色：1-黄/金黄 2-绿/黄绿 3-黑/墨绿 4-灰白/陶土色 5-红/带血 6-其他 */
  @IsOptional()
  @IsInt({ message: '大便颜色必须为整数' })
  @Min(1, { message: '大便颜色只能为 1 至 6' })
  @Max(6, { message: '大便颜色只能为 1 至 6' })
  stoolColor?: number | null;

  /** 大便性状：1-稀水样 2-糊状/软膏 3-成型软便 4-干硬颗粒 5-泡沫状 6-粘液状 7-其他 */
  @IsOptional()
  @IsInt({ message: '大便性状必须为整数' })
  @Min(1, { message: '大便性状只能为 1 至 7' })
  @Max(7, { message: '大便性状只能为 1 至 7' })
  stoolTexture?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '备注长度不能超过500' })
  remark?: string;
}
