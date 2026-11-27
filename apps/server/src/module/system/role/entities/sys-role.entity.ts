import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('sys_role', { comment: '系统角色表' })
@Unique('uk_role_key_token', ['roleKey', 'deleteToken'])
@Unique('uk_role_name', ['roleName'])
@Index('idx_enabled_sort', ['isEnabled', 'sortOrder'])
export class SysRole {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({
    name: 'role_name',
    type: 'varchar',
    length: 64,
    comment: '角色名称',
  })
  roleName: string;

  @Column({
    name: 'role_key',
    type: 'varchar',
    length: 255,
    comment: '角色标识',
  })
  roleKey: string;

  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
    comment: '显示排序',
  })
  sortOrder: number;

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

  @Column({
    name: 'delete_token',
    type: 'varchar',
    length: 36,
    default: '0',
  })
  deleteToken: string;

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
