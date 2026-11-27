import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SleepRecordController } from './sleep-record.controller';
import { SleepRecordService } from './sleep-record.service';
import { SleepRecord } from './entities/sleep-record.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SleepRecord]), AuthModule],
  controllers: [SleepRecordController],
  providers: [SleepRecordService],
})
export class SleepRecordModule {}
