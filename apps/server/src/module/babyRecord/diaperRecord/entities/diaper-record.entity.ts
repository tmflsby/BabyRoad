import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('diaper_record', { comment: '换尿布记录表' })
@Index('idx_change_time', ['changeTime'])
@Index('idx_diaper_type', ['diaperType', 'changeTime'])
export class DiaperRecord {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({ name: 'change_time', type: 'datetime', comment: '更换时间' })
  changeTime: Date;

  @Column({
    name: 'diaper_type',
    type: 'tinyint',
    comment: '类型: 1-小便, 2-大便, 3-混合',
  })
  diaperType: number;

  @Column({
    name: 'urine_amount',
    type: 'tinyint',
    nullable: true,
    comment: '小便量: 1-少(微湿), 2-中(半满), 3-多(沉甸甸)',
  })
  urineAmount: number | null;

  @Column({
    name: 'urine_color',
    type: 'tinyint',
    nullable: true,
    comment: '小便颜色: 1-清亮, 2-浅黄, 3-深黄, 4-粉红/砖红(结晶)',
  })
  urineColor: number | null;

  @Column({
    name: 'stool_color',
    type: 'tinyint',
    nullable: true,
    comment:
      '大便颜色: 1-黄/金黄, 2-绿/黄绿, 3-黑/墨绿, 4-灰白/陶土色, 5-红/带血, 6-其他',
  })
  stoolColor: number | null;

  @Column({
    name: 'stool_texture',
    type: 'tinyint',
    nullable: true,
    comment:
      '大便性状: 1-稀水样, 2-糊状/软膏, 3-成型软便, 4-干硬颗粒, 5-泡沫状, 6-粘液状, 7-其他',
  })
  stoolTexture: number | null;

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
