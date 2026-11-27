import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { CheckMenuNameDto } from './dto/check-menu-name.dto';
import { CheckMenuPathDto } from './dto/check-menu-path.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../user/entities/sys-user.entity';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 查询菜单列表（树形结构）
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list(@Query() query: QueryMenuDto) {
    return wrapperResponse(this.menuService.list(query), '获取成功');
  }

  /**
   * 校验菜单名称是否已存在
   */
  @UseGuards(JwtAuthGuard)
  @Get('name-exists')
  nameExists(@Query() query: CheckMenuNameDto) {
    return wrapperResponse(this.menuService.nameExists(query), '获取成功');
  }

  /**
   * 校验路由地址是否已存在
   */
  @UseGuards(JwtAuthGuard)
  @Get('path-exists')
  pathExists(@Query() query: CheckMenuPathDto) {
    return wrapperResponse(this.menuService.pathExists(query), '获取成功');
  }

  /**
   * 新增菜单
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMenuDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.menuService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改菜单
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.menuService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除菜单（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.menuService.remove(id, user.username),
      '删除成功',
    );
  }
}
