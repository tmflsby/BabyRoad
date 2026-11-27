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
import { SleepRecordService } from './sleep-record.service';
import { CreateSleepRecordDto } from './dto/create-sleep-record.dto';
import { UpdateSleepRecordDto } from './dto/update-sleep-record.dto';
import { QuerySleepRecordDto } from './dto/query-sleep-record.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../../system/user/entities/sys-user.entity';

@Controller('sleepRecord')
export class SleepRecordController {
  constructor(private readonly sleepRecordService: SleepRecordService) {}

  /**
   * 分页查询睡眠记录列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list(@Query() query: QuerySleepRecordDto) {
    return wrapperResponse(this.sleepRecordService.list(query), '获取成功');
  }

  /**
   * 新增睡眠记录
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateSleepRecordDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.sleepRecordService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改睡眠记录
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSleepRecordDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.sleepRecordService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除睡眠记录（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.sleepRecordService.remove(id, user.username),
      '删除成功',
    );
  }
}
