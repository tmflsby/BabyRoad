import { requestClient } from '#/api/request';

export namespace SystemDeptApi {
  /** 部门信息，字段与后端 sys_dept 表(SysDept 实体)对齐 */
  export interface SystemDept {
    [key: string]: any;
    /** 祖级列表(如: 0,1,100,1001) */
    ancestors?: string;
    /** 创建人 */
    createBy?: string;
    /** 创建时间 */
    createTime?: string;
    /** 部门名称 */
    deptName: string;
    /** 邮箱 */
    email?: string;
    /** 部门ID(bigint，接口返回可能为字符串) */
    id: string;
    /** 状态: 1-启用, 0-禁用 */
    isEnabled: 0 | 1;
    /** 负责人 */
    leader?: string;
    /** 父部门ID(0=顶级) */
    parentId: string;
    /** 联系电话 */
    phone?: string;
    /** 备注 */
    remark?: string;
    /** 显示排序 */
    sortOrder: number;
    /** 更新人 */
    updateBy?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 子部门(后端返回树形结构，叶子节点无该字段) */
    children?: SystemDept[];
  }

  /** 新增/编辑部门提交的数据，与后端 CreateDeptDto/UpdateDeptDto 对齐 */
  export interface DeptFormModel {
    deptName: string;
    email?: string;
    isEnabled: 0 | 1;
    leader?: string;
    parentId?: number | string;
    phone?: string;
    remark?: string;
    sortOrder?: number;
  }
}

/**
 * 获取部门列表数据（后端返回树形结构）
 */
async function getDeptList() {
  return requestClient.get<Array<SystemDeptApi.SystemDept>>(
    '/system/dept/list',
  );
}

/**
 * 创建部门
 * @param data 部门数据
 */
async function createDept(data: SystemDeptApi.DeptFormModel) {
  return requestClient.post('/system/dept', data);
}

/**
 * 更新部门
 *
 * @param id 部门 ID
 * @param data 部门数据
 */
async function updateDept(
  id: string,
  data: Partial<SystemDeptApi.DeptFormModel>,
) {
  return requestClient.put(`/system/dept/${id}`, data);
}

/**
 * 删除部门（后端为逻辑删除）
 * @param id 部门 ID
 */
async function deleteDept(id: string) {
  return requestClient.delete(`/system/dept/${id}`);
}

export { createDept, deleteDept, getDeptList, updateDept };
