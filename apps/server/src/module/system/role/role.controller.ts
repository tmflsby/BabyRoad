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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../user/entities/sys-user.entity';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 分页查询角色列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list(@Query() query: QueryRoleDto) {
    return wrapperResponse(this.roleService.list(query), '获取成功');
  }

  /**
   * 新增角色
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.roleService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改角色
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.roleService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除角色（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.roleService.remove(id, user.username),
      '删除成功',
    );
  }
}
