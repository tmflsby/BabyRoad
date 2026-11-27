import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SystemModule } from './module/system/system.module';
import { CoreModule } from './module/core/core.module';
import { BabyRecordModule } from './module/babyRecord/baby-record.module';
import { getMysqlUsernameAndPassword } from './utils';

const { username, password } = getMysqlUsernameAndPassword();

@Module({
  imports: [
    ServeStaticModule.forRoot({
      exclude: ['/api*'],
      rootPath: join(__dirname, '../../web-antd/dist'),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username,
      password,
      database: 'baby-road',
      autoLoadEntities: true,
    }),
    SystemModule,
    CoreModule,
    BabyRecordModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
