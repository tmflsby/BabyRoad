import { requestClient } from '#/api/request';

export namespace BabyGrowthRecordApi {
  /** 身高体重记录，字段与后端 growth_record 表(GrowthRecord 实体)对齐 */
  export interface GrowthRecord {
    /** 主键ID(bigint，接口返回为字符串) */
    id: string;
    /** 记录日期(YYYY-MM-DD) */
    recordDate: string;
    /** 体重kg(后端 DECIMAL(5,2) 已转 number) */
    weight: number;
    /** 身长cm */
    height: number;
    /** 头围cm */
    headCircumference: null | number;
    /** 胸围cm */
    chestCircumference: null | number;
    /** 体重百分位 */
    weightPercentile: null | string;
    /** 身长百分位 */
    heightPercentile: null | string;
    /** 逻辑删除: 0-正常, 1-已删除 */
    delFlag?: number;
    /** 备注 */
    remark?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
    [key: string]: any;
  }

  /** 新增提交的数据，对齐 CreateGrowthRecordDto */
  export interface CreateModel {
    chestCircumference?: null | number;
    headCircumference?: null | number;
    /** 身长cm */
    height: number;
    /** 身长百分位 */
    heightPercentile?: null | string;
    /** 记录日期(ISO 8601，如 2026-11-02) */
    recordDate: string;
    remark?: string;
    /** 体重kg */
    weight: number;
    /** 体重百分位 */
    weightPercentile?: null | string;
  }

  /** 修改提交的数据，对齐 UpdateGrowthRecordDto(字段均可选，按需下发) */
  export interface UpdateModel {
    chestCircumference?: null | number;
    headCircumference?: null | number;
    height?: number;
    heightPercentile?: null | string;
    recordDate?: string;
    remark?: string;
    weight?: number;
    weightPercentile?: null | string;
  }

  /** 列表查询参数，对齐 QueryGrowthRecordDto(日期区间字段为 startDate/endDate) */
  export interface PageQueryParams {
    endDate?: string;
    page?: number;
    pageSize?: number;
    remark?: string;
    startDate?: string;
  }

  /** 分页返回结构，与后端 GrowthRecordPageResult 对齐 */
  export interface PageResult {
    list: GrowthRecord[];
    page: number;
    pageSize: number;
    total: number;
  }
}

/**
 * 获取身高体重记录列表（后端返回 {list,total,page,pageSize} 分页结构）
 * @param params 查询参数(QueryGrowthRecordDto)
 */
async function getGrowthRecordList(
  params: BabyGrowthRecordApi.PageQueryParams,
) {
  return requestClient.get<BabyGrowthRecordApi.PageResult>(
    '/babyRecord/growthRecord/list',
    { params },
  );
}

/**
 * 新增身高体重记录
 * @param data 身高体重记录数据(对齐 CreateGrowthRecordDto)
 */
async function createGrowthRecord(data: BabyGrowthRecordApi.CreateModel) {
  return requestClient.post('/babyRecord/growthRecord', data);
}

/**
 * 修改身高体重记录
 * @param id 记录ID
 * @param data 身高体重记录数据(对齐 UpdateGrowthRecordDto)
 */
async function updateGrowthRecord(
  id: string,
  data: BabyGrowthRecordApi.UpdateModel,
) {
  return requestClient.put(`/babyRecord/growthRecord/${id}`, data);
}

/**
 * 删除身高体重记录（后端为逻辑删除）
 * @param id 记录ID
 */
async function deleteGrowthRecord(id: string) {
  return requestClient.delete(`/babyRecord/growthRecord/${id}`);
}

export {
  createGrowthRecord,
  deleteGrowthRecord,
  getGrowthRecordList,
  updateGrowthRecord,
};

