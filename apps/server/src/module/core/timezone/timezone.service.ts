import { Injectable, NotFoundException } from '@nestjs/common';
import { TIMEZONE_OPTIONS, TimezoneOption } from './timezone.constants';

@Injectable()
export class TimezoneService {
  /**
   * 进程内存储：userId -> 时区。不依赖数据库，重启后重置。
   */
  private readonly userTimezones = new Map<number, string>();

  /**
   * 系统支持的时区选项列表
   */
  getOptions(): TimezoneOption[] {
    return TIMEZONE_OPTIONS;
  }

  /**
   * 获取当前用户已设置的时区，未设置返回默认时区 Asia/Shanghai
   */
  getTimezone(userId: number): string {
    return this.userTimezones.get(userId) ?? 'Asia/Shanghai';
  }

  /**
   * 设置当前用户时区，仅允许系统支持的时区
   */
  setTimezone(userId: number, timezone: string): null {
    if (!TIMEZONE_OPTIONS.some((option) => option.value === timezone)) {
      throw new NotFoundException('不支持的时区');
    }
    this.userTimezones.set(userId, timezone);
    return null;
  }
}
