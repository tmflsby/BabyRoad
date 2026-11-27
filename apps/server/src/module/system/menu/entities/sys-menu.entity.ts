import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sys_menu', { comment: '系统菜单表' })
@Index('idx_parent_id', ['parentId'])
@Index('idx_perms', ['perms'])
export class SysMenu {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({
    name: 'parent_id',
    type: 'bigint',
    default: 0,
    comment: '父菜单ID，0表示顶级',
  })
  parentId: number;

  @Column({
    name: 'menu_type',
    type: 'char',
    length: 1,
    comment: '菜单类型: M-目录, C-菜单, F-按钮, E-内嵌, L-外链',
  })
  menuType: string;

  @Column({
    name: 'menu_name',
    type: 'varchar',
    length: 64,
    comment: '菜单名称',
  })
  menuName: string;

  @Column({
    name: 'sort_order',
    type: 'int',
    default: 0,
    comment: '显示排序',
  })
  sortOrder: number;

  @Column({
    name: 'path',
    type: 'varchar',
    length: 255,
    default: '',
    comment: '路由地址',
  })
  path: string;

  @Column({
    name: 'component',
    type: 'varchar',
    length: 255,
    default: '',
    comment: '前端组件路径',
  })
  component: string;

  @Column({
    name: 'perms',
    type: 'varchar',
    length: 128,
    default: '',
    comment: '权限标识',
  })
  perms: string;

  @Column({
    name: 'meta',
    type: 'json',
    default: {},
    comment: '前端路由meta扩展配置',
  })
  meta: Record<string, unknown>;

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
