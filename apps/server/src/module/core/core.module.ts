import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TimezoneModule } from './timezone/timezone.module';
import { MenuModule } from './menu/menu.module';

@Module({
  imports: [AuthModule, UserModule, TimezoneModule, MenuModule],
  controllers: [],
  providers: [],
})
export class CoreModule {}
