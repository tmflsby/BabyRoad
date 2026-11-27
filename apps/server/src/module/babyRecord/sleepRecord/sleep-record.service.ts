import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { SleepRecord } from './entities/sleep-record.entity';
import { CreateSleepRecordDto } from './dto/create-sleep-record.dto';
import { UpdateSleepRecordDto } from './dto/update-sleep-record.dto';
import { QuerySleepRecordDto } from './dto/query-sleep-record.dto';

/** 睡眠记录列表分页返回结构 */
export interface SleepRecordPageResult {
  list: SleepRecord[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class SleepRecordService {
  constructor(
    @InjectRepository(SleepRecord)
    private readonly sleepRecordRepository: Repository<SleepRecord>,
  ) {}

  /**
   * 分页查询睡眠记录：仅未逻辑删除数据，支持类型、质量、入睡时间区间、备注模糊过滤，
   * 按入睡时间倒序返回
   */
  async list(query: QuerySleepRecordDto): Promise<SleepRecordPageResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Record<string, unknown> = { delFlag: 0 };
    if (query.sleepType !== undefined) where.sleepType = query.sleepType;
    if (query.quality !== undefined) where.quality = query.quality;
    if (query.remark) where.remark = Like(`%${query.remark}%`);

    if (query.startTime && query.endTime) {
      where.startTime = Between(
        new Date(query.startTime),
        new Date(query.endTime),
      );
    } else if (query.startTime) {
      where.startTime = MoreThanOrEqual(new Date(query.startTime));
    } else if (query.endTime) {
      where.startTime = LessThanOrEqual(new Date(query.endTime));
    }

    const [list, total] = await this.sleepRecordRepository.findAndCount({
      where,
      order: { startTime: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total, page, pageSize };
  }

  /**
   * 新增睡眠记录：填入醒来时间时由应用层计算时长（分钟），未填则时长留空
   */
  async create(
    dto: CreateSleepRecordDto,
    operator: string,
  ): Promise<SleepRecord> {
    const startTime = new Date(dto.startTime);
    const endTime = dto.endTime ? new Date(dto.endTime) : null;

    const record = this.sleepRecordRepository.create({
      startTime,
      endTime,
      duration: this.resolveDuration(startTime, endTime),
      quality: dto.quality ?? null,
      sleepType: dto.sleepType ?? 1,
      remark: dto.remark ?? '',
      createBy: operator,
      updateBy: operator,
    });

    return this.sleepRecordRepository.save(record);
  }

  /**
   * 修改睡眠记录：按需更新字段，入睡/醒来时间发生变化时重算时长；
   * 醒来时间传 null 表示回到未醒状态并将时长置空
   */
  async update(
    id: number,
    dto: UpdateSleepRecordDto,
    operator: string,
  ): Promise<SleepRecord> {
    const record = await this.getExistingRecord(id);

    if (dto.startTime !== undefined) record.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) {
      record.endTime = dto.endTime ? new Date(dto.endTime) : null;
    }
    record.duration = this.resolveDuration(record.startTime, record.endTime);

    if (dto.quality !== undefined) record.quality = dto.quality ?? null;
    if (dto.sleepType !== undefined) record.sleepType = dto.sleepType;
    if (dto.remark !== undefined) record.remark = dto.remark;

    record.updateBy = operator;
    return this.sleepRecordRepository.save(record);
  }

  /**
   * 删除睡眠记录：逻辑删除(del_flag=1)
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingRecord(id);

    await this.sleepRecordRepository.update(
      { id },
      { delFlag: 1, updateBy: operator },
    );
    return { id };
  }

  /** 获取未被逻辑删除的睡眠记录，不存在则抛 NotFound */
  private async getExistingRecord(id: number): Promise<SleepRecord> {
    const record = await this.sleepRecordRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!record) {
      throw new NotFoundException('睡眠记录不存在');
    }
    return record;
  }

  /** 计算睡眠时长（分钟）：醒来时间为空返回 null，且不早于入睡时间 */
  private resolveDuration(
    startTime: Date,
    endTime: Date | null,
  ): number | null {
    if (!endTime) {
      return null;
    }
    const minutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000,
    );
    if (minutes <= 0) {
      throw new BadRequestException('醒来时间必须晚于入睡时间');
    }
    return minutes;
  }
}
