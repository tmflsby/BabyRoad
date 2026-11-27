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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from './entities/sys-user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 分页查询用户列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list(@Query() query: QueryUserDto) {
    return wrapperResponse(this.userService.list(query), '获取成功');
  }

  /**
   * 新增用户
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.userService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改用户
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.userService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除用户（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.userService.remove(id, user.username),
      '删除成功',
    );
  }
}
