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
import { SysRole } from './entities/sys-role.entity';
import { SysRoleMenu } from './entities/sys-role-menu.entity';
import { SysUserRole } from '../user/entities/sys-user-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { generateUUID } from '../../../utils';

/** 角色列表分页返回结构 */
export interface RolePageResult {
  list: RoleListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** 角色列表项：在实体基础上挂载已关联的菜单ID集合 */
export interface RoleListItem extends Partial<SysRole> {
  menuIds: number[];
}

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(SysRole)
    private readonly roleRepository: Repository<SysRole>,
    @InjectRepository(SysRoleMenu)
    private readonly roleMenuRepository: Repository<SysRoleMenu>,
    @InjectRepository(SysUserRole)
    private readonly userRoleRepository: Repository<SysUserRole>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 分页查询角色列表：仅未逻辑删除角色，支持名称/标识模糊、状态、时间范围过滤
   */
  async list(query: QueryRoleDto): Promise<RolePageResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Record<string, unknown> = { delFlag: 0 };
    if (query.roleName) where.roleName = Like(`%${query.roleName}%`);
    if (query.roleKey) where.roleKey = Like(`%${query.roleKey}%`);
    if (query.remark) where.remark = Like(`%${query.remark}%`);
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

    const [rows, total] = await this.roleRepository.findAndCount({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const menuIdMap = await this.getMenuIdsByRoleIds(rows.map((row) => row.id));
    const list = rows.map((row) => ({
      ...this.sanitize(row),
      menuIds: menuIdMap.get(row.id) ?? [],
    }));

    return { list, total, page, pageSize };
  }

  /**
   * 新增角色：校验名称/标识唯一，事务内落库角色并绑定菜单
   */
  async create(dto: CreateRoleDto, operator: string): Promise<RoleListItem> {
    await this.assertRoleNameUnique(dto.roleName);
    await this.assertRoleKeyUnique(dto.roleKey);

    const roleId = await this.dataSource.transaction(async (manager) => {
      const role = manager.create(SysRole, {
        roleName: dto.roleName,
        roleKey: dto.roleKey,
        sortOrder: dto.sortOrder ?? 0,
        isEnabled: dto.isEnabled ?? 1,
        remark: dto.remark ?? '',
        createBy: operator,
        updateBy: operator,
      });
      const saved = await manager.save(role);
      await this.resetRoleMenus(manager, saved.id, dto.menuIds, operator);
      return saved.id;
    });

    const role = await this.getExistingRole(roleId);
    return { ...this.sanitize(role), menuIds: dto.menuIds ?? [] };
  }

  /**
   * 修改角色：按需更新字段，变更名称/标识时校验唯一；传入 menuIds 时全量重置角色菜单
   */
  async update(
    id: number,
    dto: UpdateRoleDto,
    operator: string,
  ): Promise<RoleListItem> {
    const role = await this.getExistingRole(id);

    if (dto.roleName !== undefined && dto.roleName !== role.roleName) {
      await this.assertRoleNameUnique(dto.roleName);
    }
    if (dto.roleKey !== undefined && dto.roleKey !== role.roleKey) {
      await this.assertRoleKeyUnique(dto.roleKey);
    }

    await this.dataSource.transaction(async (manager) => {
      if (dto.roleName !== undefined) role.roleName = dto.roleName;
      if (dto.roleKey !== undefined) role.roleKey = dto.roleKey;
      if (dto.sortOrder !== undefined) role.sortOrder = dto.sortOrder;
      if (dto.isEnabled !== undefined) role.isEnabled = dto.isEnabled;
      if (dto.remark !== undefined) role.remark = dto.remark;
      role.updateBy = operator;
      await manager.save(role);
      if (dto.menuIds !== undefined) {
        await this.resetRoleMenus(manager, role.id, dto.menuIds, operator);
      }
    });

    const assignedMenuIds = await this.getMenuIdsByRoleIds([role.id]);
    const menuIds = dto.menuIds ?? assignedMenuIds.get(role.id) ?? [];
    return { ...this.sanitize(role), menuIds };
  }

  /**
   * 删除角色：逻辑删除(del_flag=1)并轮换 deleteToken 释放角色标识唯一约束；
   * 已分配用户的角色禁止删除，同时清理角色菜单关联
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingRole(id);

    const userCount = await this.userRoleRepository.count({
      where: { roleId: id },
    });
    if (userCount > 0) {
      throw new ConflictException('角色已分配给用户，无法删除');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        SysRole,
        { id },
        { delFlag: 1, deleteToken: generateUUID(), updateBy: operator },
      );
      await manager.delete(SysRoleMenu, { roleId: id });
    });
    return { id };
  }

  /** 获取未被逻辑删除的角色，不存在则抛 NotFound */
  private async getExistingRole(id: number): Promise<SysRole> {
    const role = await this.roleRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  /** 校验角色名称未被未删除角色占用 */
  private async assertRoleNameUnique(roleName: string): Promise<void> {
    const exists = await this.roleRepository.findOne({
      where: { roleName, delFlag: 0 },
    });
    if (exists) {
      throw new ConflictException('角色名称已存在');
    }
  }

  /** 校验角色标识未被未删除角色占用 */
  private async assertRoleKeyUnique(roleKey: string): Promise<void> {
    const exists = await this.roleRepository.findOne({
      where: { roleKey, delFlag: 0 },
    });
    if (exists) {
      throw new ConflictException('角色标识已存在');
    }
  }

  /** 全量重置角色菜单关联：先删后插（去重） */
  private async resetRoleMenus(
    manager: DataSource['manager'],
    roleId: number,
    menuIds: number[] | undefined,
    operator: string,
  ): Promise<void> {
    await manager.delete(SysRoleMenu, { roleId });
    if (!menuIds || menuIds.length === 0) {
      return;
    }
    const uniqueMenuIds = [...new Set(menuIds)];
    const roleMenus = uniqueMenuIds.map((menuId) =>
      manager.create(SysRoleMenu, { roleId, menuId, createBy: operator }),
    );
    await manager.save(roleMenus);
  }

  /** 批量查询角色关联的菜单ID，返回 roleId -> menuIds 映射 */
  private async getMenuIdsByRoleIds(
    roleIds: number[],
  ): Promise<Map<number, number[]>> {
    const menuIdMap = new Map<number, number[]>();
    if (roleIds.length === 0) {
      return menuIdMap;
    }
    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId: In(roleIds) },
      order: { menuId: 'ASC' },
    });
    roleMenus.forEach((rm) => {
      const ids = menuIdMap.get(rm.roleId) ?? [];
      ids.push(rm.menuId);
      menuIdMap.set(rm.roleId, ids);
    });
    return menuIdMap;
  }

  /** 剔除逻辑删除等敏感字段 */
  private sanitize(role: SysRole): Partial<SysRole> {
    const result = { ...role } as Partial<SysRole>;
    delete result.deleteToken;
    delete result.delFlag;
    return result;
  }
}
