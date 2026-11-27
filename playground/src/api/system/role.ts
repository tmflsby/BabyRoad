import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  /** 角色信息，字段与后端 sys_role 表(SysRole 实体)对齐 */
  export interface SystemRole {
    [key: string]: any;
    /** 创建人 */
    createBy?: string;
    /** 创建时间 */
    createTime?: string;
    /** 角色ID(bigint，接口返回可能为字符串) */
    id: string;
    /** 状态: 1-启用, 0-禁用 */
    isEnabled: 0 | 1;
    /** 已关联的菜单ID集合(列表返回) */
    menuIds?: number[];
    /** 备注 */
    remark?: string;
    /** 角色标识(唯一) */
    roleKey: string;
    /** 角色名称(唯一) */
    roleName: string;
    /** 显示排序 */
    sortOrder?: number;
    /** 更新人 */
    updateBy?: string;
    /** 更新时间 */
    updateTime?: string;
  }

  /** 新增/编辑角色提交的数据，与后端 CreateRoleDto/UpdateRoleDto 对齐 */
  export interface RoleFormModel {
    isEnabled?: 0 | 1;
    /** 关联的菜单ID集合(传入时后端全量重置角色菜单) */
    menuIds?: number[];
    remark?: string;
    roleKey?: string;
    roleName?: string;
    sortOrder?: number;
  }

  /** 角色列表分页返回结构，与后端 RolePageResult 对齐 */
  export interface RolePageResult {
    list: SystemRole[];
    page: number;
    pageSize: number;
    total: number;
  }
}

/**
 * 获取角色列表（后端返回 {list,total,page,pageSize} 分页结构）
 */
async function getRoleList(params: Recordable<any>) {
  return requestClient.get<SystemRoleApi.RolePageResult>('/system/role/list', {
    params,
  });
}

/**
 * 创建角色
 * @param data 角色数据(对齐 CreateRoleDto)
 */
async function createRole(data: SystemRoleApi.RoleFormModel) {
  return requestClient.post('/system/role', data);
}

/**
 * 更新角色
 * @param id 角色 ID
 * @param data 角色数据(对齐 UpdateRoleDto)
 */
async function updateRole(
  id: string,
  data: SystemRoleApi.RoleFormModel,
) {
  return requestClient.put(`/system/role/${id}`, data);
}

/**
 * 删除角色（后端为逻辑删除）
 * @param id 角色 ID
 */
async function deleteRole(id: string) {
  return requestClient.delete(`/system/role/${id}`);
}

export { createRole, deleteRole, getRoleList, updateRole };
