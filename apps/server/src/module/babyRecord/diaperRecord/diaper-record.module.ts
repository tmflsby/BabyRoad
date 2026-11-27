import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaperRecordController } from './diaper-record.controller';
import { DiaperRecordService } from './diaper-record.service';
import { DiaperRecord } from './entities/diaper-record.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DiaperRecord]), AuthModule],
  controllers: [DiaperRecordController],
  providers: [DiaperRecordService],
})
export class DiaperRecordModule {}
