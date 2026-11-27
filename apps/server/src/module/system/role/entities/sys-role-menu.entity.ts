import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('sys_role_menu', { comment: '用户和角色关联表' })
@Unique('uk_role_menu', ['roleId', 'menuId'])
@Index('idx_menu_id', ['menuId'])
export class SysRoleMenu {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({ name: 'role_id', type: 'bigint', comment: '角色ID' })
  roleId: number;

  @Column({ name: 'menu_id', type: 'bigint', comment: '菜单ID' })
  menuId: number;

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
}
