import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Matches(/^.{2,64}$/, { message: '角色名称长度为2-64个字符' })
  roleName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_:,]*$/, {
    message: '角色标识只能由字母、数字、下划线、冒号和逗号组成，且以字母开头',
  })
  roleKey?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '显示排序必须为整数' })
  @Min(0, { message: '显示排序不能为负数' })
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  isEnabled?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  /** 关联的菜单ID集合，传入时全量重置角色菜单 */
  @IsOptional()
  @IsInt({ each: true, message: '菜单ID必须为整数' })
  @ArrayNotEmpty({ message: '菜单ID集合不能为空' })
  menuIds?: number[];
}
