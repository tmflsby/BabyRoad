import { Injectable } from '@nestjs/common';

/**
 * 基于内存的已注销令牌黑名单。
 * 说明：仅在当前进程内有效，重启后失效；多实例 / 生产环境建议替换为 Redis。
 */
@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Map<string, number>();

  /** 加入黑名单，expMs 为令牌自身过期时间戳（毫秒），到期后自动清理 */
  add(jti: string, expMs: number): void {
    this.blacklist.set(jti, expMs);
    this.sweep();
  }

  isBlacklisted(jti: string): boolean {
    const expMs = this.blacklist.get(jti);
    if (!expMs) {
      return false;
    }
    if (Date.now() > expMs) {
      this.blacklist.delete(jti);
      return false;
    }
    return true;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [jti, expMs] of this.blacklist) {
      if (now > expMs) {
        this.blacklist.delete(jti);
      }
    }
  }
}
