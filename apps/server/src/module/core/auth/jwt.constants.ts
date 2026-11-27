import type { JwtSignOptions } from '@nestjs/jwt';

export const JWT_CONSTANTS = {
  secret: process.env.JWT_SECRET ?? 'baby-road-jwt-secret',
  // accessToken 有效期
  accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
    '2h') as JwtSignOptions['expiresIn'],
  // refreshToken 有效期
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
    '7d') as JwtSignOptions['expiresIn'],
};

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
