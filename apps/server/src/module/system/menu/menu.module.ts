import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { SysMenu } from './entities/sys-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysMenu])],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
