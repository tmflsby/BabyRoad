import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { QueryAnalysisDto } from './dto/query-analysis.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { wrapperResponse } from '../../../utils';

/**
 * 育儿数据看板统计接口：统一挂在 /babyRecord/analysis 下
 * 五个接口入参均为 startDate/endDate 闭区间，仅做转发，统计口径全部在 Service
 */
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /**
   * 概览：喂奶/睡眠/尿布/成长四个模块的关键汇总值
   */
  @UseGuards(JwtAuthGuard)
  @Get('overview')
  overview(@Query() query: QueryAnalysisDto) {
    return wrapperResponse(this.analysisService.overview(query), '获取成功');
  }

  /**
   * 睡眠：每日夜睡/小睡时长与次数、睡眠质量分布
   */
  @UseGuards(JwtAuthGuard)
  @Get('sleep')
  sleep(@Query() query: QueryAnalysisDto) {
    return wrapperResponse(this.analysisService.sleep(query), '获取成功');
  }

  /**
   * 喂养：每日奶量与次数、类型/母乳侧分布、24 小时时段分布
   */
  @UseGuards(JwtAuthGuard)
  @Get('feeding')
  feeding(@Query() query: QueryAnalysisDto) {
    return wrapperResponse(this.analysisService.feeding(query), '获取成功');
  }

  /**
   * 尿布：每日各类更换次数、类型分布与尿量/大便颜色/性状分布
   */
  @UseGuards(JwtAuthGuard)
  @Get('diaper')
  diaper(@Query() query: QueryAnalysisDto) {
    return wrapperResponse(this.analysisService.diaper(query), '获取成功');
  }

  /**
   * 成长：区间内测量记录（按记录日期升序），供前端绘制生长曲线
   */
  @UseGuards(JwtAuthGuard)
  @Get('growth')
  growth(@Query() query: QueryAnalysisDto) {
    return wrapperResponse(this.analysisService.growth(query), '获取成功');
  }
}
