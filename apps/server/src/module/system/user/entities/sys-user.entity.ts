import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('sys_user', { comment: '系统用户表' })
@Unique('uk_username_token', ['username', 'deleteToken'])
@Index('idx_dept_id', ['deptId'])
@Index('idx_email', ['email'])
@Index('idx_enabled_del', ['isEnabled', 'delFlag'])
@Index('idx_phone', ['phone'])
export class SysUser {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 64,
    comment: '登录账号（唯一）',
  })
  username: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    select: false,
    comment: '加密密码',
  })
  password: string;

  @Column({
    name: 'nickname',
    type: 'varchar',
    length: 64,
    default: '',
    comment: '显示昵称',
  })
  nickname: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '邮箱',
  })
  email: string;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: '手机号',
  })
  phone: string;

  @Column({
    name: 'avatar',
    type: 'varchar',
    length: 512,
    default: '',
    comment: '头像URL',
  })
  avatar: string;

  @Column({
    name: 'dept_id',
    type: 'bigint',
    nullable: true,
    comment: '所属部门ID',
  })
  deptId: number;

  @Column({
    name: 'is_enabled',
    type: 'tinyint',
    default: 1,
    comment: '状态: 1-启用, 0-禁用',
  })
  isEnabled: number;

  @Column({
    name: 'delete_token',
    type: 'varchar',
    length: 36,
    default: '0',
    comment: '删除令牌，配合username实现可重复逻辑删除',
  })
  deleteToken: string;

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
