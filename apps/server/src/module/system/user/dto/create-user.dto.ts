import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '登录账号不能为空' })
  username: string;

  @IsString()
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '部门ID必须为整数' })
  deptId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  isEnabled?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  /** 关联的角色ID集合 */
  @IsOptional()
  @IsInt({ each: true, message: '角色ID必须为整数' })
  @ArrayNotEmpty({ message: '角色ID集合不能为空' })
  roleIds?: number[];
}
