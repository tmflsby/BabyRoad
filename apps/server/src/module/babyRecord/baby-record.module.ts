import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AnalysisModule } from './analysis/analysis.module';
import { SleepRecordModule } from './sleepRecord/sleep-record.module';
import { GrowthRecordModule } from './growthRecord/growth-record.module';
import { FeedingRecordModule } from './feedingRecord/feeding-record.module';
import { DiaperRecordModule } from './diaperRecord/diaper-record.module';

/**
 * 育儿记录模块：统一挂载 babyRecord 路由前缀
 * 注意 RouterModule.register 不会自动导入子模块，children 仍需在上层 imports 中显式声明
 */
@Module({
  imports: [
    AnalysisModule,
    SleepRecordModule,
    GrowthRecordModule,
    FeedingRecordModule,
    DiaperRecordModule,
    RouterModule.register([
      {
        path: 'babyRecord',
        children: [
          AnalysisModule,
          SleepRecordModule,
          GrowthRecordModule,
          FeedingRecordModule,
          DiaperRecordModule,
        ],
      },
    ]),
  ],
})
export class BabyRecordModule {}
