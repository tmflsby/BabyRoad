import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { SysUser } from '../../system/user/entities/sys-user.entity';
import { LoginDto } from './dto/login.dto';
import { JWT_CONSTANTS, TokenType } from './jwt.constants';
import { TokenBlacklistService } from './token-blacklist.service';
import { generateUUID, DEFAULT_HOME_PATH } from '../../../utils';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  homePath: string;
}

interface TokenPayload {
  sub: number;
  username: string;
  nickname: string;
  type: TokenType;
  jti: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  /**
   * 用户登录，成功后返回 accessToken + refreshToken
   */
  async login(dto: LoginDto): Promise<LoginResult> {
    // password 字段定义为 select: false，登录时需显式查出
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username: dto.username })
      .andWhere('user.del_flag = 0')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }
    if (user.isEnabled !== 1) {
      throw new UnauthorizedException('用户已被禁用，请联系管理员');
    }

    const passwordMatched = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatched) {
      throw new UnauthorizedException('账号或密码错误');
    }

    return this.signTokens(user);
  }

  /**
   * 使用 refreshToken 换取新的 accessToken（同时轮换 refreshToken）
   */
  async refresh(refreshToken: string): Promise<LoginResult> {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: JWT_CONSTANTS.secret,
      });
    } catch {
      throw new UnauthorizedException('refreshToken 无效或已过期');
    }

    if (payload.type !== TokenType.REFRESH) {
      throw new UnauthorizedException('请使用 refreshToken 进行刷新');
    }
    if (this.tokenBlacklist.isBlacklisted(payload.jti)) {
      throw new UnauthorizedException('refreshToken 已失效，请重新登录');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, delFlag: 0 },
    });
    if (!user || user.isEnabled !== 1) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    // 轮换：旧的 refreshToken 立即作废
    if (payload.exp) {
      this.tokenBlacklist.add(payload.jti, payload.exp * 1000);
    }

    return this.signTokens(user);
  }

  /**
   * 登出：将当前 accessToken 加入黑名单，使其立即失效
   * @param accessToken 完整的 Bearer Token 字符串（不含 "Bearer " 前缀亦可）
   */
  logout(accessToken: string): void {
    const token = accessToken.replace(/^Bearer\s+/i, '');
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(token, {
        secret: JWT_CONSTANTS.secret,
      });
    } catch {
      throw new BadRequestException('Token 无效，登出失败');
    }
    const expMs = payload.exp ? payload.exp * 1000 : Date.now() + 3600_000;
    this.tokenBlacklist.add(payload.jti, expMs);
  }

  /**
   * 获取当前用户的权限码集合（sys_menu.perms）
   * 关联链路：sys_user_role -> sys_role_menu -> sys_menu，仅取启用且未删除的角色/菜单
   */
  async codes(userId: number): Promise<string[]> {
    const rows = await this.userRepository.query<{ perms: string }[]>(
      `SELECT DISTINCT m.perms AS perms
       FROM sys_menu m
       INNER JOIN sys_role_menu rm ON rm.menu_id = m.id
       INNER JOIN sys_user_role ur ON ur.role_id = rm.role_id
       INNER JOIN sys_role r ON r.id = ur.role_id
       WHERE ur.user_id = ?
         AND m.del_flag = 0
         AND m.is_enabled = 1
         AND r.del_flag = 0
         AND r.is_enabled = 1
         AND m.perms <> ''`,
      [userId],
    );
    return rows.map((row) => row.perms);
  }

  /**
   * 生成 bcrypt 密码哈希，供创建用户等场景使用
   */
  hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  /**
   * 签发一对 accessToken / refreshToken，写入唯一 jti 以便登出/轮换
   */
  private signTokens(user: SysUser): LoginResult {
    const base = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname,
    };

    const accessToken = this.jwtService.sign(
      { ...base, type: TokenType.ACCESS, jti: generateUUID() },
      {
        secret: JWT_CONSTANTS.secret,
        expiresIn: JWT_CONSTANTS.accessExpiresIn,
      },
    );
    const refreshToken = this.jwtService.sign(
      { ...base, type: TokenType.REFRESH, jti: generateUUID() },
      {
        secret: JWT_CONSTANTS.secret,
        expiresIn: JWT_CONSTANTS.refreshExpiresIn,
      },
    );

    return { accessToken, refreshToken, homePath: DEFAULT_HOME_PATH };
  }
}
