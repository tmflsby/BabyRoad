import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { SleepRecord } from '../sleepRecord/entities/sleep-record.entity';
import { FeedingRecord } from '../feedingRecord/entities/feeding-record.entity';
import { DiaperRecord } from '../diaperRecord/entities/diaper-record.entity';
import { GrowthRecord } from '../growthRecord/entities/growth-record.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SleepRecord,
      FeedingRecord,
      DiaperRecord,
      GrowthRecord,
    ]),
    AuthModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
