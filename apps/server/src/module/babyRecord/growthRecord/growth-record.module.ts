import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrowthRecordController } from './growth-record.controller';
import { GrowthRecordService } from './growth-record.service';
import { GrowthRecord } from './entities/growth-record.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GrowthRecord]), AuthModule],
  controllers: [GrowthRecordController],
  providers: [GrowthRecordService],
})
export class GrowthRecordModule {}
