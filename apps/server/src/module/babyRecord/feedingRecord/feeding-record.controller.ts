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
import { FeedingRecordService } from './feeding-record.service';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { UpdateFeedingRecordDto } from './dto/update-feeding-record.dto';
import { QueryFeedingRecordDto } from './dto/query-feeding-record.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';
import type { SysUser } from '../../system/user/entities/sys-user.entity';

@Controller('feedingRecord')
export class FeedingRecordController {
  constructor(private readonly feedingRecordService: FeedingRecordService) {}

  /**
   * 分页查询喂奶记录列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('list')
  list(@Query() query: QueryFeedingRecordDto) {
    return wrapperResponse(this.feedingRecordService.list(query), '获取成功');
  }

  /**
   * 新增喂奶记录
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateFeedingRecordDto, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.feedingRecordService.create(dto, user.username),
      '新增成功',
    );
  }

  /**
   * 修改喂奶记录
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeedingRecordDto,
    @CurrentUser() user: SysUser,
  ) {
    return wrapperResponse(
      this.feedingRecordService.update(id, dto, user.username),
      '修改成功',
    );
  }

  /**
   * 删除喂奶记录（逻辑删除）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SysUser) {
    return wrapperResponse(
      this.feedingRecordService.remove(id, user.username),
      '删除成功',
    );
  }
}
