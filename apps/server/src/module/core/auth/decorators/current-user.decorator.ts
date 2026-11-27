import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SysUser } from '../../../system/user/entities/sys-user.entity';

/**
 * 获取 JWT 认证后挂载在 request.user 上的当前登录用户
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SysUser => {
    const request = ctx.switchToHttp().getRequest<{ user: SysUser }>();
    return request.user;
  },
);
