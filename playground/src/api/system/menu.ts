import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemMenuApi {
  /** 徽标颜色集合 */
  export const BadgeVariants = [
    'default',
    'destructive',
    'primary',
    'success',
    'warning',
  ] as const;
  /** 徽标类型集合 */
  export const BadgeTypes = ['dot', 'normal'] as const;
  /**
   * 菜单类型集合，取值与后端 menuType 字段(sys_menu.menu_type)保持一致
   * M-目录 C-菜单 F-按钮 E-内嵌 L-外链
   */
  export const MenuTypes = ['M', 'C', 'F', 'E', 'L'] as const;

  export type MenuType = (typeof MenuTypes)[number];

  /**
   * 前端路由 meta 扩展配置
   * 后端以 JSON 列(meta)整体存储、不做字段校验，故路由相关扩展项均放在此处
   */
  export interface MenuMeta {
    /** 激活时显示的图标 */
    activeIcon?: string;
    /** 作为路由时，需要激活的菜单Path */
    activePath?: string;
    /** 固定在标签栏 */
    affixTab?: boolean;
    /** 在标签栏固定的顺序 */
    affixTabOrder?: number;
    /** 徽标内容(当徽标类型为normal时有效) */
    badge?: string;
    /** 徽标类型 */
    badgeType?: (typeof BadgeTypes)[number];
    /** 徽标颜色 */
    badgeVariants?: (typeof BadgeVariants)[number];
    /** 在菜单中隐藏下级 */
    hideChildrenInMenu?: boolean;
    /** 在面包屑中隐藏 */
    hideInBreadcrumb?: boolean;
    /** 在菜单中隐藏 */
    hideInMenu?: boolean;
    /** 在标签栏中隐藏 */
    hideInTab?: boolean;
    /** 菜单图标 */
    icon?: string;
    /** 内嵌(E)Iframe的URL */
    iframeSrc?: string;
    /** 是否缓存页面 */
    keepAlive?: boolean;
    /** 外链(L)页面的URL */
    link?: string;
    /** 同一个路由最大打开的标签数 */
    maxNumOfOpenTab?: number;
    /** 无需基础布局 */
    noBasicLayout?: boolean;
    /** 是否在新窗口打开 */
    openInNewWindow?: boolean;
    /** 菜单排序 */
    order?: number;
    /** 额外的路由参数 */
    query?: Recordable<any>;
    /** 菜单标题(可为多语言key) */
    title?: string;
  }

  /** 系统菜单，字段与后端 sys_menu 表(SysMenu 实体)对齐 */
  export interface SystemMenu {
    [key: string]: any;
    /** 前端组件路径 */
    component?: string;
    /** 创建人 */
    createBy?: string;
    /** 创建时间 */
    createTime?: string;
    /** 菜单ID(bigint，接口返回可能为字符串) */
    id: string;
    /** 状态: 1-启用, 0-禁用 */
    isEnabled: 0 | 1;
    /** 菜单名称(同级下唯一) */
    menuName: string;
    /** 菜单类型: M/C/F/E/L */
    menuType: MenuType;
    /** 前端路由meta扩展配置 */
    meta?: MenuMeta;
    /** 父菜单ID('0'表示顶级) */
    parentId: string;
    /** 路由地址 */
    path?: string;
    /** 权限标识 */
    perms?: string;
    /** 备注 */
    remark?: string;
    /** 显示排序 */
    sortOrder: number;
    /** 更新人 */
    updateBy?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 子级(后端 /menu/list 返回树形结构，叶子节点无该字段) */
    children?: SystemMenu[];
  }

  /** 新增/编辑菜单提交的数据，与后端 CreateMenuDto/UpdateMenuDto 白名单对齐 */
  export interface MenuFormModel {
    component?: string;
    isEnabled?: 0 | 1;
    menuName?: string;
    menuType?: MenuType;
    meta?: MenuMeta;
    parentId?: number | string;
    path?: string;
    perms?: string;
    remark?: string;
    sortOrder?: number;
  }

  /** 列表查询参数，与后端 QueryMenuDto 白名单对齐 */
  export interface MenuQueryParams {
    endTime?: string;
    isEnabled?: 0 | 1;
    menuName?: string;
    menuType?: MenuType;
    path?: string;
    perms?: string;
    startTime?: string;
  }

  /** 唯一性校验接口的返回结构，与后端 ExistsResult 对齐 */
  export interface ExistsResult {
    exists: boolean;
  }
}

/**
 * 获取菜单数据列表（后端直接返回带 children 的树形结构）
 * @param params 查询条件，仅下发后端 QueryMenuDto 支持的字段
 */
async function getMenuList(params?: SystemMenuApi.MenuQueryParams) {
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>(
    '/system/menu/list',
    { params },
  );
}

/** 唯一性校验接口修改场景下需排除的自身ID归一化（后端 @IsInt @Min(1)，非法值不下发） */
function toExistsCheckId(id?: number | string) {
  if (id === undefined || id === null || id === '') {
    return undefined;
  }
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId >= 1 ? numericId : undefined;
}

/**
 * 校验菜单名称是否已被其它菜单占用（后端为全局范围，不限层级）
 * @param menuName 菜单名称
 * @param id 修改场景下传入自身ID，后端校验时排除自己
 */
async function isMenuNameExists(menuName: string, id?: number | string) {
  const res = await requestClient.get<SystemMenuApi.ExistsResult>(
    '/system/menu/name-exists',
    {
      params: {
        id: toExistsCheckId(id),
        menuName,
      },
    },
  );
  return res.exists;
}

/**
 * 校验路由地址是否已被其它菜单占用
 * @param path 路由地址
 * @param id 修改场景下传入自身ID，后端校验时排除自己
 */
async function isMenuPathExists(path: string, id?: number | string) {
  const res = await requestClient.get<SystemMenuApi.ExistsResult>(
    '/system/menu/path-exists',
    {
      params: {
        id: toExistsCheckId(id),
        path,
      },
    },
  );
  return res.exists;
}

/**
 * 创建菜单
 * @param data 菜单数据(对齐 CreateMenuDto)
 */
async function createMenu(data: SystemMenuApi.MenuFormModel) {
  return requestClient.post('/system/menu', data);
}

/**
 * 更新菜单（后端按需更新，未传字段保持原值）
 * @param id 菜单 ID
 * @param data 菜单数据(对齐 UpdateMenuDto)
 */
async function updateMenu(
  id: string,
  data: Partial<SystemMenuApi.MenuFormModel>,
) {
  return requestClient.put(`/system/menu/${id}`, data);
}

/**
 * 删除菜单（后端为逻辑删除，存在下级菜单时会被拒绝）
 * @param id 菜单 ID
 */
async function deleteMenu(id: string) {
  return requestClient.delete(`/system/menu/${id}`);
}

export {
  createMenu,
  deleteMenu,
  getMenuList,
  isMenuNameExists,
  isMenuPathExists,
  updateMenu,
};
