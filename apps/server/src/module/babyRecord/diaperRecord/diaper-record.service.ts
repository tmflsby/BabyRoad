import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { DiaperRecord } from './entities/diaper-record.entity';
import { CreateDiaperRecordDto } from './dto/create-diaper-record.dto';
import { UpdateDiaperRecordDto } from './dto/update-diaper-record.dto';
import { QueryDiaperRecordDto } from './dto/query-diaper-record.dto';

/** 换尿布记录列表分页返回结构 */
export interface DiaperRecordPageResult {
  list: DiaperRecord[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class DiaperRecordService {
  constructor(
    @InjectRepository(DiaperRecord)
    private readonly diaperRecordRepository: Repository<DiaperRecord>,
  ) {}

  /**
   * 分页查询换尿布记录：仅未逻辑删除数据，支持类型、小便量/颜色、大便颜色/性状、
   * 更换时间区间、备注模糊过滤，按更换时间倒序返回
   */
  async list(query: QueryDiaperRecordDto): Promise<DiaperRecordPageResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Record<string, unknown> = { delFlag: 0 };
    if (query.diaperType !== undefined) where.diaperType = query.diaperType;
    if (query.urineAmount !== undefined) where.urineAmount = query.urineAmount;
    if (query.urineColor !== undefined) where.urineColor = query.urineColor;
    if (query.stoolColor !== undefined) where.stoolColor = query.stoolColor;
    if (query.stoolTexture !== undefined) {
      where.stoolTexture = query.stoolTexture;
    }
    if (query.remark) where.remark = Like(`%${query.remark}%`);

    if (query.startTime && query.endTime) {
      where.changeTime = Between(
        new Date(query.startTime),
        new Date(query.endTime),
      );
    } else if (query.startTime) {
      where.changeTime = MoreThanOrEqual(new Date(query.startTime));
    } else if (query.endTime) {
      where.changeTime = LessThanOrEqual(new Date(query.endTime));
    }

    const [list, total] = await this.diaperRecordRepository.findAndCount({
      where,
      order: { changeTime: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { list, total, page, pageSize };
  }

  /**
   * 新增换尿布记录
   */
  async create(
    dto: CreateDiaperRecordDto,
    operator: string,
  ): Promise<DiaperRecord> {
    const record = this.diaperRecordRepository.create({
      changeTime: new Date(dto.changeTime),
      diaperType: dto.diaperType,
      urineAmount: dto.urineAmount ?? null,
      urineColor: dto.urineColor ?? null,
      stoolColor: dto.stoolColor ?? null,
      stoolTexture: dto.stoolTexture ?? null,
      remark: dto.remark ?? '',
      createBy: operator,
      updateBy: operator,
    });

    return this.diaperRecordRepository.save(record);
  }

  /**
   * 修改换尿布记录：按需更新字段，可空字段传 null 表示清空
   */
  async update(
    id: number,
    dto: UpdateDiaperRecordDto,
    operator: string,
  ): Promise<DiaperRecord> {
    const record = await this.getExistingRecord(id);

    if (dto.changeTime !== undefined) {
      record.changeTime = new Date(dto.changeTime);
    }
    if (dto.diaperType !== undefined) record.diaperType = dto.diaperType;
    if (dto.urineAmount !== undefined) {
      record.urineAmount = dto.urineAmount ?? null;
    }
    if (dto.urineColor !== undefined)
      record.urineColor = dto.urineColor ?? null;
    if (dto.stoolColor !== undefined)
      record.stoolColor = dto.stoolColor ?? null;
    if (dto.stoolTexture !== undefined) {
      record.stoolTexture = dto.stoolTexture ?? null;
    }
    if (dto.remark !== undefined) record.remark = dto.remark;

    record.updateBy = operator;
    return this.diaperRecordRepository.save(record);
  }

  /**
   * 删除换尿布记录：逻辑删除(del_flag=1)
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingRecord(id);

    await this.diaperRecordRepository.update(
      { id },
      { delFlag: 1, updateBy: operator },
    );
    return { id };
  }

  /** 获取未被逻辑删除的换尿布记录，不存在则抛 NotFound */
  private async getExistingRecord(id: number): Promise<DiaperRecord> {
    const record = await this.diaperRecordRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!record) {
      throw new NotFoundException('换尿布记录不存在');
    }
    return record;
  }
}
