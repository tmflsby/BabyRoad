import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sleep_record', { comment: '睡眠记录表' })
@Index('idx_start_time', ['startTime'])
@Index('idx_sleep_type_date', ['sleepType', 'startTime'])
export class SleepRecord {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({ name: 'start_time', type: 'datetime', comment: '入睡时间' })
  startTime: Date;

  @Column({
    name: 'end_time',
    type: 'datetime',
    nullable: true,
    comment: '醒来时间（未醒则为NULL）',
  })
  endTime: Date | null;

  @Column({
    name: 'duration',
    type: 'int',
    nullable: true,
    comment: '时长(分钟)，醒来时间填入后由应用层计算',
  })
  duration: number | null;

  @Column({
    name: 'quality',
    type: 'tinyint',
    nullable: true,
    comment: '质量: 1-好, 2-一般, 3-差',
  })
  quality: number | null;

  @Column({
    name: 'sleep_type',
    type: 'tinyint',
    default: 1,
    comment: '类型: 1-小睡, 2-夜睡',
  })
  sleepType: number;

  @Column({
    name: 'del_flag',
    type: 'tinyint',
    default: 0,
    comment: '逻辑删除: 0-正常, 1-已删除',
  })
  delFlag: number;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @Column({
    name: 'create_by',
    type: 'varchar',
    length: 64,
    default: '',
    comment: '创建人',
  })
  createBy: string;

  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;

  @Column({
    name: 'update_by',
    type: 'varchar',
    length: 64,
    default: '',
    comment: '更新人',
  })
  updateBy: string;

  @Column({
    name: 'remark',
    type: 'varchar',
    length: 500,
    default: '',
    comment: '备注',
  })
  remark: string;
}
