import { Controller, Get, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SysUser } from '../../system/user/entities/sys-user.entity';
import { wrapperResponse } from '../../../utils';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 获取当前用户角色授权的菜单树形结构
   */
  @UseGuards(JwtAuthGuard)
  @Get('all')
  all(@CurrentUser() user: SysUser) {
    return wrapperResponse(this.menuService.all(user.id), '获取成功');
  }
}
