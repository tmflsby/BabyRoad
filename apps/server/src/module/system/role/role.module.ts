import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { SysRole } from './entities/sys-role.entity';
import { SysRoleMenu } from './entities/sys-role-menu.entity';
import { SysUserRole } from '../user/entities/sys-user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysRole, SysRoleMenu, SysUserRole])],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
