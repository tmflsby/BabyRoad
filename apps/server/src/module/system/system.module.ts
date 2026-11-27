import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { MenuModule } from './menu/menu.module';
import { DeptModule } from './dept/dept.module';

@Module({
  imports: [
    UserModule,
    RoleModule,
    MenuModule,
    DeptModule,
    RouterModule.register([
      {
        path: 'system',
        children: [UserModule, RoleModule, MenuModule, DeptModule],
      },
    ]),
  ],
})
export class SystemModule {}
