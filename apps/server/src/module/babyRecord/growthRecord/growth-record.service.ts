import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { GrowthRecord } from './entities/growth-record.entity';
import { CreateGrowthRecordDto } from './dto/create-growth-record.dto';
import { UpdateGrowthRecordDto } from './dto/update-growth-record.dto';
import { QueryGrowthRecordDto } from './dto/query-growth-record.dto';

/** 身高体重记录列表分页返回结构 */
export interface GrowthRecordPageResult {
  list: GrowthRecord[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class GrowthRecordService {
  constructor(
    @InjectRepository(GrowthRecord)
    private readonly growthRecordRepository: Repository<GrowthRecord>,
  ) {}

  /**
   * 分页查询身高体重记录：仅未逻辑删除数据，支持记录日期区间、备注模糊过滤，
   * 按记录日期倒序返回（便于前端绘制生长曲线时取最近数据）
   */
  async list(query: QueryGrowthRecordDto): Promise<GrowthRecordPageResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Record<string, unknown> = { delFlag: 0 };
    if (query.remark) where.remark = Like(`%${query.remark}%`);

    if (query.startDate && query.endDate) {
      where.recordDate = Between(
        this.toDateOnly(query.startDate),
        this.toDateOnly(query.endDate),
      );
    } else if (query.startDate) {
      where.recordDate = MoreThanOrEqual(this.toDateOnly(query.startDate));
    } else if (query.endDate) {
      where.recordDate = LessThanOrEqual(this.toDateOnly(query.endDate));
    }

    const [list, total] = await this.growthRecordRepository.findAndCount({
      where,
      order: { recordDate: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total, page, pageSize };
  }

  /**
   * 新增身高体重记录
   */
  async create(
    dto: CreateGrowthRecordDto,
    operator: string,
  ): Promise<GrowthRecord> {
    const record = this.growthRecordRepository.create({
      recordDate: this.toDateOnly(dto.recordDate),
      weight: dto.weight,
      height: dto.height,
      headCircumference: dto.headCircumference ?? null,
      chestCircumference: dto.chestCircumference ?? null,
      weightPercentile: dto.weightPercentile ?? null,
      heightPercentile: dto.heightPercentile ?? null,
      remark: dto.remark ?? '',
      createBy: operator,
      updateBy: operator,
    });

    return this.growthRecordRepository.save(record);
  }

  /**
   * 修改身高体重记录：按需更新字段，可空字段传 null 表示清空
   */
  async update(
    id: number,
    dto: UpdateGrowthRecordDto,
    operator: string,
  ): Promise<GrowthRecord> {
    const record = await this.getExistingRecord(id);

    if (dto.recordDate !== undefined) {
      record.recordDate = this.toDateOnly(dto.recordDate);
    }
    if (dto.weight !== undefined) record.weight = dto.weight;
    if (dto.height !== undefined) record.height = dto.height;
    if (dto.headCircumference !== undefined) {
      record.headCircumference = dto.headCircumference ?? null;
    }
    if (dto.chestCircumference !== undefined) {
      record.chestCircumference = dto.chestCircumference ?? null;
    }
    if (dto.weightPercentile !== undefined) {
      record.weightPercentile = dto.weightPercentile ?? null;
    }
    if (dto.heightPercentile !== undefined) {
      record.heightPercentile = dto.heightPercentile ?? null;
    }
    if (dto.remark !== undefined) record.remark = dto.remark;

    record.updateBy = operator;
    return this.growthRecordRepository.save(record);
  }

  /**
   * 删除身高体重记录：逻辑删除(del_flag=1)
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingRecord(id);

    await this.growthRecordRepository.update(
      { id },
      { delFlag: 1, updateBy: operator },
    );
    return { id };
  }

  /** 获取未被逻辑删除的身高体重记录，不存在则抛 NotFound */
  private async getExistingRecord(id: number): Promise<GrowthRecord> {
    const record = await this.growthRecordRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!record) {
      throw new NotFoundException('身高体重记录不存在');
    }
    return record;
  }

  /** 统一截取为 YYYY-MM-DD，避免 DATE 列写入多余时间部分 */
  private toDateOnly(value: string): string {
    return value.slice(0, 10);
  }
}
