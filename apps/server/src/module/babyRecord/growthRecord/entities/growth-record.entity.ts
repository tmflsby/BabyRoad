import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { decimalTransformer } from '../../../../utils';

@Entity('growth_record', { comment: '身高体重记录表' })
@Index('idx_record_date', ['recordDate'])
export class GrowthRecord {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({
    name: 'record_date',
    type: 'date',
    comment: '记录日期',
  })
  recordDate: string;

  @Column({
    name: 'weight',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: decimalTransformer,
    comment: '体重kg',
  })
  weight: number;

  @Column({
    name: 'height',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: decimalTransformer,
    comment: '身长cm',
  })
  height: number;

  @Column({
    name: 'head_circumference',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
    comment: '头围cm',
  })
  headCircumference: number | null;

  @Column({
    name: 'chest_circumference',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
    comment: '胸围cm',
  })
  chestCircumference: number | null;

  @Column({
    name: 'weight_percentile',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '体重百分位',
  })
  weightPercentile: string | null;

  @Column({
    name: 'height_percentile',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '身长百分位',
  })
  heightPercentile: string | null;

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
