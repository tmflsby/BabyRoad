import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { SysMenu } from '../../system/menu/entities/sys-menu.entity';
import { SysRole } from '../../system/role/entities/sys-role.entity';
import { SysRoleMenu } from '../../system/role/entities/sys-role-menu.entity';
import { SysUserRole } from '../../system/user/entities/sys-user-role.entity';
import type { SanitizedMenu } from '../../system/menu/menu.service';
import { buildTree } from '../../../utils';

/** 菜单树节点：在实体基础上挂载子菜单集合 */
export interface MenuTreeNode extends SanitizedMenu {
  children?: MenuTreeNode[];
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(SysMenu)
    private readonly menuRepository: Repository<SysMenu>,
    @InjectRepository(SysRole)
    private readonly roleRepository: Repository<SysRole>,
    @InjectRepository(SysUserRole)
    private readonly userRoleRepository: Repository<SysUserRole>,
    @InjectRepository(SysRoleMenu)
    private readonly roleMenuRepository: Repository<SysRoleMenu>,
  ) {}

  /**
   * 查询当前用户授权的菜单树形结构：按用户角色链（sys_user_role -> sys_role_menu）
   * 过滤授权菜单，仅未删除且启用的节点，排除按钮(F)类型，
   * 并剪掉不含任何可导航子菜单的空目录分支
   */
  async all(userId: number): Promise<MenuTreeNode[]> {
    const authorized = await this.findAuthorizedMenus(userId);
    if (authorized.size === 0) {
      return [];
    }

    const menus = await this.menuRepository.find({
      where: {
        id: In([...authorized]),
        delFlag: 0,
        isEnabled: 1,
        menuType: Not('F'),
      },
      order: { parentId: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });

    return this.pruneNavigable(
      buildTree<MenuTreeNode>(
        menus.map((menu) => this.sanitize(menu)),
        (menu) => menu.id,
        (menu) => menu.parentId,
      ),
    );
  }

  /**
   * 查询用户授权的菜单ID集合：用户 -> 启用且未删除的角色 -> 角色授权的菜单；
   * 逐级向上补齐父级菜单ID，保证授权子菜单的祖先目录可参与建树
   */
  private async findAuthorizedMenus(userId: number): Promise<Set<string>> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      select: { roleId: true },
    });
    if (userRoles.length === 0) {
      return new Set();
    }

    // bigint 列运行时为字符串，统一用字符串比较避免精度问题
    const roleIds = [...new Set(userRoles.map((item) => String(item.roleId)))];
    const roles = await this.roleRepository.find({
      where: { id: In(roleIds), delFlag: 0, isEnabled: 1 },
      select: { id: true },
    });
    if (roles.length === 0) {
      return new Set();
    }

    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId: In(roles.map((role) => String(role.id))) },
      select: { menuId: true },
    });
    const menuIds = new Set(roleMenus.map((item) => String(item.menuId)));
    if (menuIds.size === 0) {
      return new Set();
    }

    // 补齐祖先：授权节点若挂在未直接授权的目录下，需带出目录才能还原树结构
    let pending = [...menuIds];
    while (pending.length > 0) {
      const parents = await this.menuRepository.find({
        where: { id: In(pending), delFlag: 0 },
        select: { parentId: true },
      });
      const next = parents
        .map((parent) => String(parent.parentId))
        .filter((parentId) => parentId !== '0' && !menuIds.has(parentId));
      next.forEach((parentId) => menuIds.add(parentId));
      pending = next;
    }
    return menuIds;
  }

  /**
   * 递归剪枝：目录(M)若没有任何启用子孙则移除；
   * 叶子节点（按钮已排除且无子节点的路由地址为空的目录）同样移除；
   * 清除叶子节点的空 children 字段，简化返回结构
   */
  private pruneNavigable(nodes: MenuTreeNode[]): MenuTreeNode[] {
    const result: MenuTreeNode[] = [];
    nodes.forEach((node) => {
      const children = node.children ? this.pruneNavigable(node.children) : [];
      if (node.menuType === 'M' && children.length === 0) {
        return;
      }
      if (children.length > 0) {
        node.children = children;
      } else {
        delete node.children;
      }
      result.push(node);
    });
    return result;
  }

  /** 剔除敏感字段，并补充与 menuName 同值的 name 字段 */
  private sanitize(menu: SysMenu): SanitizedMenu {
    const result = { ...menu } as SanitizedMenu;
    delete result.delFlag;
    delete result.createBy;
    delete result.updateBy;
    result.name = result.menuName;
    return result;
  }
}
