import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { decimalTransformer } from '../../../../utils';

@Entity('feeding_record', { comment: '喂奶记录表' })
@Index('idx_feed_time', ['feedTime'])
@Index('idx_feed_type_date', ['feedType', 'feedTime'])
export class FeedingRecord {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({ name: 'feed_time', type: 'datetime', comment: '喂奶时间' })
  feedTime: Date;

  @Column({
    name: 'feed_type',
    type: 'tinyint',
    comment: '类型: 1-母乳, 2-配方奶, 3-混合',
  })
  feedType: number;

  @Column({
    name: 'side',
    type: 'tinyint',
    nullable: true,
    comment: '母乳侧: 1-左, 2-右, 3-双侧',
  })
  side: number | null;

  @Column({
    name: 'duration',
    type: 'int',
    nullable: true,
    comment: '喂奶时长(分钟)',
  })
  duration: number | null;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 6,
    scale: 1,
    nullable: true,
    transformer: decimalTransformer,
    comment: '奶量ml',
  })
  amount: number | null;

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
