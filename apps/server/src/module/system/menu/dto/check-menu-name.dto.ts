import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  Matches,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';

/** 菜单名称唯一性校验入参（全局范围，不限层级） */
export class CheckMenuNameDto {
  @IsString()
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @Matches(/^.{2,64}$/, { message: '菜单名称长度为2-64个字符' })
  menuName: string;

  /** 修改场景下传入自身ID，校验时排除自己 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '菜单ID必须为整数' })
  @Min(1, { message: '菜单ID不能小于1' })
  id?: number;
}
