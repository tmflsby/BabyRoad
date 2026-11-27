import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '登录账号不能为空' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '登录密码不能为空' })
  password: string;
}
