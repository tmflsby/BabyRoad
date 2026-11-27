import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '父菜单ID必须为整数' })
  @Min(0, { message: '父菜单ID不能为负数' })
  parentId?: number;

  @IsString()
  @IsNotEmpty({ message: '菜单类型不能为空' })
  @Matches(/^[MCFEL]$/, {
    message: '菜单类型只能为 M(目录)、C(菜单)、F(按钮)、E(内嵌) 或 L(外链)',
  })
  menuType: string;

  @IsString()
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @Matches(/^.{2,64}$/, { message: '菜单名称长度为2-64个字符' })
  menuName: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '显示排序必须为整数' })
  @Min(0, { message: '显示排序不能为负数' })
  sortOrder?: number;

  /** 路由地址：普通菜单以 / 开头，外链(E/L)可为 http(s):// 地址 */
  @IsOptional()
  @IsString()
  @Matches(/^(\/[^\s]*|https?:\/\/[^\s]+)$/, {
    message:
      '路由地址需以 / 开头，内嵌/外链需以 http(s):// 开头，且不能包含空格',
  })
  path?: string;

  /** 前端组件路径 */
  @IsOptional()
  @IsString()
  component?: string;

  /** 权限标识 */
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_:,]*$/, {
    message: '权限标识只能由字母、数字、下划线、冒号和逗号组成，且以字母开头',
  })
  perms?: string;

  /** 前端路由 meta 扩展配置 */
  @IsOptional()
  meta?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  isEnabled?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
