import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../../system/user/entities/sys-user.entity';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录，成功后返回 accessToken + refreshToken
   */
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return wrapperResponse(this.authService.login(dto), '登录成功');
  }

  /**
   * 使用 refreshToken 刷新，换取新的 accessToken
   */
  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return wrapperResponse(
      this.authService.refresh(dto.refreshToken),
      '刷新成功',
    );
  }

  /**
   * 登出：将当前 accessToken 加入黑名单使其失效
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Headers('authorization') authorization: string) {
    return wrapperResponse(this.authService.logout(authorization), '登出成功');
  }

  /**
   * 获取当前登录用户的权限码集合
   */
  @UseGuards(JwtAuthGuard)
  @Get('codes')
  codes(@CurrentUser() user: SysUser) {
    return wrapperResponse(this.authService.codes(user.id), '获取成功');
  }
}
