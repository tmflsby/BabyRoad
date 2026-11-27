import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TimezoneService } from './timezone.service';
import { SetTimezoneDto } from './dto/set-timezone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { wrapperResponse } from '../../../utils';

@Controller('/timezone')
@UseGuards(JwtAuthGuard)
export class TimezoneController {
  constructor(private readonly timezoneService: TimezoneService) {}

  /**
   * 获取系统支持的时区列表
   */
  @Get('getTimezoneOptions')
  getTimezoneOptions() {
    return wrapperResponse(this.timezoneService.getOptions(), '获取成功');
  }

  /**
   * 获取当前用户时区
   */
  @Get('getTimezone')
  getTimezone(@CurrentUser() user: { id: number }) {
    return wrapperResponse(
      this.timezoneService.getTimezone(user.id),
      '获取成功',
    );
  }

  /**
   * 设置当前用户时区
   */
  @Post('setTimezone')
  setTimezone(
    @CurrentUser() user: { id: number },
    @Body() dto: SetTimezoneDto,
  ) {
    return wrapperResponse(
      this.timezoneService.setTimezone(user.id, dto.timezone),
      '设置成功',
    );
  }
}
