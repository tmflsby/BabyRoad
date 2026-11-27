import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { SysUser } from '../../../system/user/entities/sys-user.entity';
import { JWT_CONSTANTS, TokenType } from '../jwt.constants';
import { TokenBlacklistService } from '../token-blacklist.service';

export interface JwtPayload {
  sub: number;
  username: string;
  nickname: string;
  type: TokenType;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_CONSTANTS.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<SysUser> {
    // 仅允许 accessToken 访问受保护接口
    if (payload.type !== TokenType.ACCESS) {
      throw new UnauthorizedException('令牌类型错误');
    }
    if (this.tokenBlacklist.isBlacklisted(payload.jti)) {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, delFlag: 0 },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    if (user.isEnabled !== 1) {
      throw new UnauthorizedException('用户已被禁用');
    }
    return user;
  }
}
