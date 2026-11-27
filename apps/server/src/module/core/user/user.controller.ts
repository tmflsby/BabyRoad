import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../../system/user/entities/sys-user.entity';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前登录用户信息（需携带 Bearer accessToken）
   */
  @UseGuards(JwtAuthGuard)
  @Get('info')
  info(@CurrentUser() user: SysUser) {
    return wrapperResponse(this.userService.info(user), '获取成功');
  }
}
