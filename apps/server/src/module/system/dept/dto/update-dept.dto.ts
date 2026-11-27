import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateDeptDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '父部门ID必须为整数' })
  @Min(0, { message: '父部门ID不能为负数' })
  parentId?: number;

  @IsOptional()
  @IsString()
  deptName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '显示排序必须为整数' })
  @Min(0, { message: '显示排序不能为负数' })
  sortOrder?: number;

  @IsOptional()
  @IsString()
  leader?: string;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

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
