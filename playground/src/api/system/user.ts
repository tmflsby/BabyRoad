import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  /** 用户关联角色摘要，与后端 UserRoleBrief 对齐 */
  export interface UserRoleBrief {
    id: number;
    roleKey: string;
    roleName: string;
  }

  /** 用户信息，字段与后端 sys_user 表(SysUser 实体)对齐 */
  export interface SystemUser {
    [key: string]: any;
    /** 头像URL */
    avatar?: string;
    /** 创建人 */
    createBy?: string;
    /** 创建时间 */
    createTime?: string;
    /** 所属部门ID(bigint，接口返回可能为字符串) */
    deptId?: number | string;
    /** 邮箱 */
    email?: string;
    /** 性别(字典 user_gender)，后端实体同步拓展中 */
    gender?: number;
    /** 用户ID(bigint，接口返回为字符串) */
    id: string;
    /** 状态: 1-启用, 0-禁用 */
    isEnabled: 0 | 1;
    /** 显示昵称 */
    nickname?: string;
    /** 手机号 */
    phone?: string;
    /** 备注 */
    remark?: string;
    /** 更新人 */
    updateBy?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 登录账号(唯一) */
    username: string;
    /** 关联角色ID集合(后端返回) */
    roleIds?: number[];
    /** 关联角色摘要列表(后端返回) */
    roles?: UserRoleBrief[];
  }

  /** 新增/编辑用户提交的数据，与后端 CreateUserDto/UpdateUserDto 对齐 */
  export interface UserFormModel {
    deptId?: number | string;
    email?: string;
    /** 性别(字典 user_gender)，后端实体/DTO 同步拓展中 */
    gender?: number;
    isEnabled?: 0 | 1;
    nickname?: string;
    /** 新增时必填；编辑时留空表示不修改密码 */
    password?: string;
    phone?: string;
    remark?: string;
    /**
     * 关联角色ID集合，与后端 roleIds 对齐(需整型数组)。
     * 创建时不能为空数组；编辑时传入则全量重置用户角色
     */
    roleIds?: number[];
    /** 登录账号仅新增时可提交，后端不允许修改 */
    username?: string;
  }

  /** 用户列表分页返回结构，与后端 UserPageResult 对齐 */
  export interface UserPageResult {
    list: SystemUser[];
    page: number;
    pageSize: number;
    total: number;
  }
}

/**
 * 获取用户列表数据（后端返回 page/pageSize 分页结构）
 */
async function getUserList(params: Recordable<any>) {
  return requestClient.get<SystemUserApi.UserPageResult>('/system/user/list', {
    params,
  });
}

/**
 * 创建用户
 * @param data 用户数据
 */
async function createUser(data: SystemUserApi.UserFormModel) {
  return requestClient.post('/system/user', data);
}

/**
 * 更新用户
 *
 * @param id 用户 ID
 * @param data 用户数据（不含 username，password 留空表示不修改）
 */
async function updateUser(id: string, data: Partial<SystemUserApi.UserFormModel>) {
  return requestClient.put(`/system/user/${id}`, data);
}

/**
 * 删除用户（后端为逻辑删除）
 * @param id 用户 ID
 */
async function deleteUser(id: string) {
  return requestClient.delete(`/system/user/${id}`);
}

export { createUser, deleteUser, getUserList, updateUser };
