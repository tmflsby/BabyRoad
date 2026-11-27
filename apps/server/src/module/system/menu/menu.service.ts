import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { SysMenu } from './entities/sys-menu.entity';
import { SysRoleMenu } from '../role/entities/sys-role-menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { CheckMenuNameDto } from './dto/check-menu-name.dto';
import { CheckMenuPathDto } from './dto/check-menu-path.dto';
import { buildTree } from '../../../utils';

/** 对外返回的菜单对象：实体字段 + name（与 menuName 同值，便于前端直接使用） */
export type SanitizedMenu = Partial<SysMenu> & { name?: string };

/** 菜单树节点：在实体基础上挂载子菜单集合 */
export interface MenuTreeNode extends SanitizedMenu {
  children?: MenuTreeNode[];
}

/** 存在性校验返回结构 */
export interface ExistsResult {
  exists: boolean;
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(SysMenu)
    private readonly menuRepository: Repository<SysMenu>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 查询菜单列表（树形结构）：仅未逻辑删除菜单，支持名称/路由/权限标识模糊、类型、状态、时间范围过滤
   */
  async list(query: QueryMenuDto): Promise<MenuTreeNode[]> {
    const where: Record<string, unknown> = { delFlag: 0 };
    if (query.menuName) where.menuName = Like(`%${query.menuName}%`);
    if (query.path) where.path = Like(`%${query.path}%`);
    if (query.perms) where.perms = Like(`%${query.perms}%`);
    if (query.menuType) where.menuType = query.menuType;
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

    const menus = await this.menuRepository.find({
      where,
      order: { parentId: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });

    return buildTree<MenuTreeNode>(
      menus.map((menu) => this.sanitize(menu)),
      (menu) => menu.id,
      (menu) => menu.parentId,
    );
  }

  /**
   * 新增菜单：校验父菜单合法性、全局名称唯一性及路由地址唯一性
   */
  async create(dto: CreateMenuDto, operator: string): Promise<SanitizedMenu> {
    const parentId = dto.parentId ?? 0;
    await this.assertParentExists(parentId);
    await this.assertMenuNameUnique(dto.menuName);
    if (dto.path) {
      await this.assertPathUnique(dto.path);
    }

    const menu = this.menuRepository.create({
      parentId,
      menuType: dto.menuType,
      menuName: dto.menuName,
      sortOrder: dto.sortOrder ?? 0,
      path: dto.path ?? '',
      component: dto.component ?? '',
      perms: dto.perms ?? '',
      meta: dto.meta ?? {},
      isEnabled: dto.isEnabled ?? 1,
      remark: dto.remark ?? '',
      createBy: operator,
      updateBy: operator,
    });

    const saved = await this.menuRepository.save(menu);
    return this.sanitize(saved);
  }

  /**
   * 修改菜单：按需更新字段；变更父级/名称/路由时重新校验唯一性，禁止挂到自身或子孙节点下
   */
  async update(
    id: number,
    dto: UpdateMenuDto,
    operator: string,
  ): Promise<SanitizedMenu> {
    const menu = await this.getExistingMenu(id);

    if (dto.parentId !== undefined && dto.parentId !== menu.parentId) {
      await this.assertParentLegal(id, dto.parentId);
    }
    if (dto.menuName !== undefined && dto.menuName !== menu.menuName) {
      await this.assertMenuNameUnique(dto.menuName, id);
    }
    if (dto.path !== undefined && dto.path !== menu.path && dto.path !== '') {
      await this.assertPathUnique(dto.path, id);
    }

    if (dto.parentId !== undefined) menu.parentId = dto.parentId;
    if (dto.menuType !== undefined) menu.menuType = dto.menuType;
    if (dto.menuName !== undefined) menu.menuName = dto.menuName;
    if (dto.sortOrder !== undefined) menu.sortOrder = dto.sortOrder;
    if (dto.path !== undefined) menu.path = dto.path;
    if (dto.component !== undefined) menu.component = dto.component;
    if (dto.perms !== undefined) menu.perms = dto.perms;
    if (dto.meta !== undefined) menu.meta = dto.meta;
    if (dto.isEnabled !== undefined) menu.isEnabled = dto.isEnabled;
    if (dto.remark !== undefined) menu.remark = dto.remark;
    menu.updateBy = operator;

    const saved = await this.menuRepository.save(menu);
    return this.sanitize(saved);
  }

  /**
   * 删除菜单：逻辑删除(del_flag=1)，存在未删除的下级菜单时禁止删除，同时清理角色-菜单关联
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingMenu(id);

    const childCount = await this.menuRepository.count({
      where: { parentId: id, delFlag: 0 },
    });
    if (childCount > 0) {
      throw new ConflictException('存在下级菜单，无法删除');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(SysMenu, { id }, { delFlag: 1, updateBy: operator });
      await manager.delete(SysRoleMenu, { menuId: id });
    });
    return { id };
  }

  /**
   * 校验菜单名称是否已被其它菜单占用（全局范围，不限层级）
   * 按 menuName 命中记录后，若其 id 与传入的自身 id 相同则视为不冲突，返回 false
   */
  async nameExists(dto: CheckMenuNameDto): Promise<ExistsResult> {
    const where: Record<string, unknown> = {
      menuName: dto.menuName,
      delFlag: 0,
    };
    const menu = await this.menuRepository.findOne({ where });
    if (!menu) {
      return { exists: false };
    }
    // bigint 列运行时为字符串，比较前统一 Number() 归一化
    return { exists: Number(menu.id) !== Number(dto.id) };
  }

  /**
   * 校验路由地址是否已被其它菜单占用
   * 按 path 命中记录后，若其 id 与传入的自身 id 相同则视为不冲突，返回 false
   */
  async pathExists(dto: CheckMenuPathDto): Promise<ExistsResult> {
    const menu = await this.menuRepository.findOne({
      where: { path: dto.path, delFlag: 0 },
    });
    if (!menu) {
      return { exists: false };
    }
    return { exists: Number(menu.id) !== Number(dto.id) };
  }

  /** 获取未被逻辑删除的菜单，不存在则抛 NotFound */
  private async getExistingMenu(id: number): Promise<SysMenu> {
    const menu = await this.menuRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!menu) {
      throw new NotFoundException('菜单不存在');
    }
    return menu;
  }

  /** 校验父菜单存在（顶级 0 直接放行） */
  private async assertParentExists(parentId: number): Promise<void> {
    if (parentId <= 0) {
      return;
    }
    const parent = await this.menuRepository.findOne({
      where: { id: parentId, delFlag: 0 },
    });
    if (!parent) {
      throw new NotFoundException('父菜单不存在');
    }
  }

  /** 校验变更后的父菜单不能是自身或其子孙节点 */
  private async assertParentLegal(id: number, parentId: number): Promise<void> {
    if (parentId === id) {
      throw new ConflictException('父菜单不能为自身');
    }
    if (parentId <= 0) {
      return;
    }
    await this.assertParentExists(parentId);
    const descendantIds = await this.collectDescendantIds(id);
    if (descendantIds.includes(Number(parentId))) {
      throw new ConflictException('不能将菜单移动到自己的下级菜单');
    }
  }

  /** 校验菜单名称全局唯一（可排除自身） */
  private async assertMenuNameUnique(
    menuName: string,
    excludeId?: number,
  ): Promise<void> {
    const menu = await this.menuRepository.findOne({
      where: {
        menuName,
        delFlag: 0,
        ...(excludeId !== undefined ? { id: Not(excludeId) } : {}),
      },
    });
    if (menu) {
      throw new ConflictException('菜单名称已存在');
    }
  }

  /** 校验路由地址唯一（可排除自身） */
  private async assertPathUnique(
    path: string,
    excludeId?: number,
  ): Promise<void> {
    const menu = await this.menuRepository.findOne({
      where: {
        path,
        delFlag: 0,
        ...(excludeId !== undefined ? { id: Not(excludeId) } : {}),
      },
    });
    if (menu) {
      throw new ConflictException('路由地址已存在');
    }
  }

  /** BFS 收集指定菜单的所有子孙ID（含自身），bigint 归一化为 number */
  private async collectDescendantIds(id: number): Promise<number[]> {
    const all = await this.menuRepository.find({
      where: { delFlag: 0 },
      select: { id: true, parentId: true },
    });
    const childrenMap = new Map<number, number[]>();
    all.forEach((m) => {
      const pid = Number(m.parentId);
      const list = childrenMap.get(pid) ?? [];
      list.push(Number(m.id));
      childrenMap.set(pid, list);
    });

    const result: number[] = [Number(id)];
    const queue: number[] = [Number(id)];
    while (queue.length > 0) {
      const current = queue.shift() as number;
      const children = childrenMap.get(current) ?? [];
      children.forEach((child) => {
        if (!result.includes(child)) {
          result.push(child);
          queue.push(child);
        }
      });
    }
    return result;
  }

  /** 剔除敏感字段，并补充与 menuName 同值的 name 字段 */
  private sanitize(menu: SysMenu): SanitizedMenu {
    const result = { ...menu } as SanitizedMenu;
    delete result.delFlag;
    result.name = result.menuName;
    return result;
  }
}
