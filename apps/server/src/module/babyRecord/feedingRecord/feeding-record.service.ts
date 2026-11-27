import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { FeedingRecord } from './entities/feeding-record.entity';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { UpdateFeedingRecordDto } from './dto/update-feeding-record.dto';
import { QueryFeedingRecordDto } from './dto/query-feeding-record.dto';

/** 喂奶记录列表分页返回结构 */
export interface FeedingRecordPageResult {
  list: FeedingRecord[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class FeedingRecordService {
  constructor(
    @InjectRepository(FeedingRecord)
    private readonly feedingRecordRepository: Repository<FeedingRecord>,
  ) {}

  /**
   * 分页查询喂奶记录：仅未逻辑删除数据，支持类型、母乳侧、喂奶时间区间、备注模糊过滤，
   * 按喂奶时间倒序返回
   */
  async list(query: QueryFeedingRecordDto): Promise<FeedingRecordPageResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Record<string, unknown> = { delFlag: 0 };
    if (query.feedType !== undefined) where.feedType = query.feedType;
    if (query.side !== undefined) where.side = query.side;
    if (query.remark) where.remark = Like(`%${query.remark}%`);

    if (query.startTime && query.endTime) {
      where.feedTime = Between(
        new Date(query.startTime),
        new Date(query.endTime),
      );
    } else if (query.startTime) {
      where.feedTime = MoreThanOrEqual(new Date(query.startTime));
    } else if (query.endTime) {
      where.feedTime = LessThanOrEqual(new Date(query.endTime));
    }

    const [list, total] = await this.feedingRecordRepository.findAndCount({
      where,
      order: { feedTime: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total, page, pageSize };
  }

  /**
   * 新增喂奶记录
   */
  async create(
    dto: CreateFeedingRecordDto,
    operator: string,
  ): Promise<FeedingRecord> {
    const record = this.feedingRecordRepository.create({
      feedTime: new Date(dto.feedTime),
      feedType: dto.feedType,
      side: dto.side ?? null,
      duration: dto.duration ?? null,
      amount: dto.amount ?? null,
      remark: dto.remark ?? '',
      createBy: operator,
      updateBy: operator,
    });

    return this.feedingRecordRepository.save(record);
  }

  /**
   * 修改喂奶记录：按需更新字段，可空字段传 null 表示清空
   */
  async update(
    id: number,
    dto: UpdateFeedingRecordDto,
    operator: string,
  ): Promise<FeedingRecord> {
    const record = await this.getExistingRecord(id);

    if (dto.feedTime !== undefined) record.feedTime = new Date(dto.feedTime);
    if (dto.feedType !== undefined) record.feedType = dto.feedType;
    if (dto.side !== undefined) record.side = dto.side ?? null;
    if (dto.duration !== undefined) record.duration = dto.duration ?? null;
    if (dto.amount !== undefined) record.amount = dto.amount ?? null;
    if (dto.remark !== undefined) record.remark = dto.remark;

    record.updateBy = operator;
    return this.feedingRecordRepository.save(record);
  }

  /**
   * 删除喂奶记录：逻辑删除(del_flag=1)
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingRecord(id);

    await this.feedingRecordRepository.update(
      { id },
      { delFlag: 1, updateBy: operator },
    );
    return { id };
  }

  /** 获取未被逻辑删除的喂奶记录，不存在则抛 NotFound */
  private async getExistingRecord(id: number): Promise<FeedingRecord> {
    const record = await this.feedingRecordRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!record) {
      throw new NotFoundException('喂奶记录不存在');
    }
    return record;
  }
}
