import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('sys_user_role', { comment: '用户和角色关联表' })
@Unique('uk_user_role', ['userId', 'roleId'])
@Index('idx_role_id', ['roleId'])
export class SysUserRole {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: '主键ID' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', comment: '用户ID' })
  userId: number;

  @Column({ name: 'role_id', type: 'bigint', comment: '角色ID' })
  roleId: number;

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
