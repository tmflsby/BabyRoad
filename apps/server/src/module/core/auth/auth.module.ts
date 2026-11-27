import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenBlacklistService } from './token-blacklist.service';
import { SysUser } from '../../system/user/entities/sys-user.entity';
import { JWT_CONSTANTS } from './jwt.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysUser]),
    PassportModule,
    JwtModule.register({
      secret: JWT_CONSTANTS.secret,
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, TokenBlacklistService],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, JwtModule, TokenBlacklistService],
})
export class AuthModule {}
