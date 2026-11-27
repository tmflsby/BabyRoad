import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedingRecordController } from './feeding-record.controller';
import { FeedingRecordService } from './feeding-record.service';
import { FeedingRecord } from './entities/feeding-record.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FeedingRecord]), AuthModule],
  controllers: [FeedingRecordController],
  providers: [FeedingRecordService],
})
export class FeedingRecordModule {}
