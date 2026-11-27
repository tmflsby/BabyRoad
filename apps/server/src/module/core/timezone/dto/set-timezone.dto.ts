import { IsNotEmpty, IsString } from 'class-validator';

export class SetTimezoneDto {
  @IsString()
  @IsNotEmpty({ message: '时区不能为空' })
  timezone: string;
}
