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
import { DiaperRecordService } from './diaper-record.service';
import { CreateDiaperRecordDto } from './dto/create-diaper-record.dto';
import { UpdateDiaperRecordDto } from './dto/update-diaper-record.dto';
import { QueryDiaperRecordDto } from './dto/query-diaper-record.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../../system/user/entities/sys-user.entity';

@Controller('diaperRecord')
export class DiaperRecordController {
  constructor(private readonly diaperRecordService: DiaperRecordService) {}

  /**
   * 分页查询换尿布记录列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list(@Query() query: QueryDiaperRecordDto) {
    return wrapperResponse(this.diaperRecordService.list(query), '获取成功');
  }

  /**
   * 新增换尿布记录
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDiaperRecordDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.diaperRecordService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改换尿布记录
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiaperRecordDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.diaperRecordService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除换尿布记录（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.diaperRecordService.remove(id, user.username),
      '删除成功',
    );
  }
}
