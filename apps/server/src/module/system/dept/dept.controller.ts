import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DeptService } from './dept.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../user/entities/sys-user.entity';

@Controller('dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  /**
   * 查询部门列表（树形结构）
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list() {
    return wrapperResponse(this.deptService.list(), '获取成功');
  }

  /**
   * 新增部门
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDeptDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.deptService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改部门
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeptDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.deptService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除部门（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.deptService.remove(id, user.username),
      '删除成功',
    );
  }
}
