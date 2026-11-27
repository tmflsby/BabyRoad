import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class QueryMenuDto {
  @IsOptional()
  @IsString()
  menuName?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  perms?: string;

  /** 菜单类型 M/C/F/E/L */
  @IsOptional()
  @IsString()
  @Matches(/^[MCFEL]$/, { message: '菜单类型只能为 M、C、F、E 或 L' })
  menuType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  isEnabled?: number;

  /** 创建时间范围（ISO 8601） */
  @IsOptional()
  @IsDateString({}, { message: '创建时间起始格式不正确' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: '创建时间截止格式不正确' })
  endTime?: string;
}
