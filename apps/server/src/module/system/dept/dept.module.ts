import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeptController } from './dept.controller';
import { DeptService } from './dept.service';
import { SysDept } from './entities/sys-dept.entity';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SysDept]), AuthModule],
  controllers: [DeptController],
  providers: [DeptService],
})
export class DeptModule {}
