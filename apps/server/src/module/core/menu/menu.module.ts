import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { SysMenu } from '../../system/menu/entities/sys-menu.entity';
import { SysRole } from '../../system/role/entities/sys-role.entity';
import { SysRoleMenu } from '../../system/role/entities/sys-role-menu.entity';
import { SysUserRole } from '../../system/user/entities/sys-user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysMenu, SysRole, SysUserRole, SysRoleMenu]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
