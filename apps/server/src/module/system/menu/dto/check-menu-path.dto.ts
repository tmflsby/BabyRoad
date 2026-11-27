import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  Matches,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';

/** 路由地址唯一性校验入参 */
export class CheckMenuPathDto {
  @IsString()
  @IsNotEmpty({ message: '路由地址不能为空' })
  @Matches(/^(\/[^\s]*|https?:\/\/[^\s]+)$/, {
    message:
      '路由地址需以 / 开头，内嵌/外链需以 http(s):// 开头，且不能包含空格',
  })
  path: string;

  /** 修改场景下传入自身ID，校验时排除自己 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '菜单ID必须为整数' })
  @Min(1, { message: '菜单ID不能小于1' })
  id?: number;
}
