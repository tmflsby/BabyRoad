import { Injectable } from '@nestjs/common';
import type { SysUser } from '../../system/user/entities/sys-user.entity';
import { DEFAULT_HOME_PATH } from '../../../utils';

@Injectable()
export class UserService {
  /**
   * 返回当前登录用户信息，剔除密码及逻辑删除等敏感字段，
   * 并附带首页路径 homePath（当前无对应列，返回固定默认值）
   */
  info(user: SysUser): Partial<SysUser> & { homePath: string } {
    const result = { ...user } as Partial<SysUser> & { homePath: string };
    delete result.password;
    delete result.deleteToken;
    delete result.delFlag;
    result.homePath = DEFAULT_HOME_PATH;
    return result;
  }
}
