import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_dept', { comment: '系统部门表' })
@Index('idx_parent_id', ['parentId'])
@Index('idx_ancestors', ['ancestors'])
export class SysDept {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({
    name: 'parent_id',
    type: 'bigint',
    default: 0,
    comment: '父部门ID（0=顶级）',
  })
  parentId: number;

  @Column({
    name: 'ancestors',
    type: 'varchar',
    length: 512,
    default: '',
    comment: '祖级列表（如: 0,1,100,1001）',
  })
  ancestors: string;

  @Column({
    name: 'dept_name',
    type: 'varchar',
    length: 64,
    comment: '部门名称',
  })
  deptName: string;

  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
    comment: '显示排序',
  })
  sortOrder: number;

  @Column({
    name: 'leader',
    type: 'varchar',
    length: 64,
    default: '',
    comment: '负责人',
  })
  leader: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 32,
    default: '',
    comment: '联系电话',
  })
  phone: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 128,
    default: '',
    comment: '邮箱',
  })
  email: string;

  @Column({
    name: 'is_enabled',
    type: 'tinyint',
    default: 1,
    comment: '状态: 1-启用, 0-禁用',
  })
  isEnabled: number;

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
