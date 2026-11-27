import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  In,
  Like,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SysUser } from './entities/sys-user.entity';
import { SysUserRole } from './entities/sys-user-role.entity';
import { SysRole } from '../role/entities/sys-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { generateUUID } from '../../../utils';

/** 用户关联角色摘要 */
export interface UserRoleBrief {
  id: number;
  roleName: string;
  roleKey: string;
}

/** 用户列表/详情项：脱敏实体 + 关联角色信息 */
export interface UserListItem extends Partial<SysUser> {
  roleIds: number[];
  roles: UserRoleBrief[];
}

/** 用户列表分页返回结构 */
export interface UserPageResult {
  list: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
    @InjectRepository(SysUserRole)
    private readonly userRoleRepository: Repository<SysUserRole>,
    @InjectRepository(SysRole)
    private readonly roleRepository: Repository<SysRole>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 新增用户：校验账号唯一、bcrypt 加密密码，事务内同步用户角色关联，返回脱敏信息
   */
  async create(dto: CreateUserDto, operator: string): Promise<UserListItem> {
    const exists = await this.userRepository.findOne({
      where: { username: dto.username, delFlag: 0 },
    });
    if (exists) {
      throw new ConflictException('登录账号已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const saved = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(SysUser, {
        username: dto.username,
        password: hashedPassword,
        nickname: dto.nickname ?? '',
        email: dto.email,
        phone: dto.phone,
        deptId: dto.deptId,
        isEnabled: dto.isEnabled ?? 1,
        remark: dto.remark ?? '',
        createBy: operator,
        updateBy: operator,
      });
      const savedUser = await manager.save(user);
      await this.resetUserRoles(manager, savedUser.id, dto.roleIds, operator);
      return savedUser;
    });

    return this.buildListItem(saved, dto.roleIds ?? []);
  }

  /**
   * 分页查询用户列表：仅未逻辑删除用户，支持账号/昵称模糊、部门、状态过滤
   * 同时返回每个用户的关联角色ID与角色摘要信息
   */
  async list(query: QueryUserDto): Promise<UserPageResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Record<string, unknown> = { delFlag: 0 };
    if (query.username) where.username = Like(`%${query.username}%`);
    if (query.nickname) where.nickname = Like(`%${query.nickname}%`);
    if (query.remark) where.remark = Like(`%${query.remark}%`);
    if (query.deptId !== undefined) where.deptId = query.deptId;
    if (query.isEnabled !== undefined) where.isEnabled = query.isEnabled;

    if (query.startTime && query.endTime) {
      where.createTime = Between(
        new Date(query.startTime),
        new Date(query.endTime),
      );
    } else if (query.startTime) {
      where.createTime = MoreThanOrEqual(new Date(query.startTime));
    } else if (query.endTime) {
      where.createTime = LessThanOrEqual(new Date(query.endTime));
    }

    const [rows, total] = await this.userRepository.findAndCount({
      where,
      order: { createTime: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const rolesMap = await this.getRolesByUserIds(rows.map((row) => row.id));
    const list = rows.map((row) => {
      const roles = rolesMap.get(row.id) ?? [];
      return this.decorate(row, roles);
    });

    return { list, total, page, pageSize };
  }

  /**
   * 修改用户：按需更新字段，携带 password 时重置密码；传入 roleIds 时全量重置用户角色；
   * 不允许修改登录账号
   */
  async update(
    id: number,
    dto: UpdateUserDto,
    operator: string,
  ): Promise<UserListItem> {
    const user = await this.getExistingUser(id);

    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.deptId !== undefined) user.deptId = dto.deptId;
    if (dto.isEnabled !== undefined) user.isEnabled = dto.isEnabled;
    if (dto.remark !== undefined) user.remark = dto.remark;
    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);

    user.updateBy = operator;
    await this.dataSource.transaction(async (manager) => {
      await manager.save(user);
      if (dto.roleIds !== undefined) {
        await this.resetUserRoles(manager, user.id, dto.roleIds, operator);
      }
    });

    // 未传 roleIds 时保持原有关联，传了则以传入值回显
    const roleIds =
      dto.roleIds ??
      ((await this.getRolesByUserIds([user.id])).get(user.id) ?? []).map(
        (role) => role.id,
      );
    return this.buildListItem(user, roleIds);
  }

  /**
   * 删除用户：逻辑删除(del_flag=1)，轮换 deleteToken 释放登录账号唯一约束，并清理用户角色关联
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingUser(id);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        SysUser,
        { id },
        { delFlag: 1, deleteToken: generateUUID(), updateBy: operator },
      );
      await manager.delete(SysUserRole, { userId: id });
    });
    return { id };
  }

  /** 获取未被逻辑删除的用户，不存在则抛 NotFound */
  private async getExistingUser(id: number): Promise<SysUser> {
    const user = await this.userRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /** 全量重置用户角色关联：先删后插（去重、忽略空集合） */
  private async resetUserRoles(
    manager: DataSource['manager'],
    userId: number,
    roleIds: number[] | undefined,
    operator: string,
  ): Promise<void> {
    await manager.delete(SysUserRole, { userId });
    if (!roleIds || roleIds.length === 0) {
      return;
    }
    const uniqueRoleIds = [...new Set(roleIds)];
    const userRoles = uniqueRoleIds.map((roleId) =>
      manager.create(SysUserRole, { userId, roleId, createBy: operator }),
    );
    await manager.save(userRoles);
  }

  /** 批量查询用户关联的角色（仅未删除角色），返回 userId -> 角色摘要 映射 */
  private async getRolesByUserIds(
    userIds: number[],
  ): Promise<Map<number, UserRoleBrief[]>> {
    const rolesMap = new Map<number, UserRoleBrief[]>();
    if (userIds.length === 0) {
      return rolesMap;
    }

    const userRoles = await this.userRoleRepository.find({
      where: { userId: In(userIds) },
    });
    if (userRoles.length === 0) {
      return rolesMap;
    }

    const allRoleIds = [...new Set(userRoles.map((ur) => ur.roleId))];
    const roles = await this.roleRepository.find({
      where: { id: In(allRoleIds), delFlag: 0 },
    });
    const roleById = new Map<number, UserRoleBrief>(
      roles.map((role) => [
        role.id,
        { id: role.id, roleName: role.roleName, roleKey: role.roleKey },
      ]),
    );

    userRoles.forEach((ur) => {
      const role = roleById.get(ur.roleId);
      if (!role) {
        return;
      }
      const list = rolesMap.get(ur.userId) ?? [];
      list.push(role);
      rolesMap.set(ur.userId, list);
    });
    return rolesMap;
  }

  /** 组装用户返回项：脱敏实体 + 基于最新关联的角色信息 */
  private async buildListItem(
    user: SysUser,
    roleIds: number[],
  ): Promise<UserListItem> {
    const roles = await this.getRolesByUserIds([user.id]);
    return this.decorate(user, roles.get(user.id) ?? [], roleIds);
  }

  /** 将角色摘要挂载到脱敏用户对象上 */
  private decorate(
    user: SysUser,
    roles: UserRoleBrief[],
    roleIds?: number[],
  ): UserListItem {
    return {
      ...this.sanitize(user),
      roles,
      roleIds: roleIds ?? roles.map((role) => role.id),
    };
  }

  /** 剔除密码及逻辑删除等敏感字段 */
  private sanitize(user: SysUser): Partial<SysUser> {
    const result = { ...user } as Partial<SysUser>;
    delete result.password;
    delete result.deleteToken;
    delete result.delFlag;
    return result;
  }
}
