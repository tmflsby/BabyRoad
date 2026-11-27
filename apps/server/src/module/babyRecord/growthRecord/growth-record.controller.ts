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
import { GrowthRecordService } from './growth-record.service';
import { CreateGrowthRecordDto } from './dto/create-growth-record.dto';
import { UpdateGrowthRecordDto } from './dto/update-growth-record.dto';
import { QueryGrowthRecordDto } from './dto/query-growth-record.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../../system/user/entities/sys-user.entity';

@Controller('growthRecord')
export class GrowthRecordController {
  constructor(private readonly growthRecordService: GrowthRecordService) {}

  /**
   * 分页查询身高体重记录列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list(@Query() query: QueryGrowthRecordDto) {
    return wrapperResponse(this.growthRecordService.list(query), '获取成功');
  }

  /**
   * 新增身高体重记录
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateGrowthRecordDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.growthRecordService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改身高体重记录
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGrowthRecordDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.growthRecordService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除身高体重记录（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.growthRecordService.remove(id, user.username),
      '删除成功',
    );
  }
}
