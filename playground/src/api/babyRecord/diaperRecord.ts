import { requestClient } from '#/api/request';

export namespace BabyDiaperRecordApi {
  /** 换尿布记录，字段与后端 diaper_record 表(DiaperRecord 实体)对齐 */
  export interface DiaperRecord {
    /** 主键ID(bigint，接口返回为字符串) */
    id: string;
    /** 更换时间 */
    changeTime: string;
    /** 类型: 1-小便, 2-大便, 3-混合 */
    diaperType: number;
    /** 小便量: 1-少, 2-中, 3-多 */
    urineAmount: null | number;
    /** 小便颜色: 1-清亮, 2-浅黄, 3-深黄, 4-粉红/砖红 */
    urineColor: null | number;
    /** 大便颜色: 1~6 */
    stoolColor: null | number;
    /** 大便性状: 1~7 */
    stoolTexture: null | number;
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

  /** 新增提交的数据，对齐 CreateDiaperRecordDto */
  export interface CreateModel {
    /** 更换时间(ISO 8601) */
    changeTime: string;
    diaperType: number;
    remark?: string;
    stoolColor?: null | number;
    stoolTexture?: null | number;
    urineAmount?: null | number;
    urineColor?: null | number;
  }

  /** 修改提交的数据，对齐 UpdateDiaperRecordDto(字段均可选，按需下发) */
  export interface UpdateModel {
    changeTime?: string;
    diaperType?: number;
    remark?: string;
    stoolColor?: null | number;
    stoolTexture?: null | number;
    urineAmount?: null | number;
    urineColor?: null | number;
  }

  /** 列表查询参数，对齐 QueryDiaperRecordDto */
  export interface PageQueryParams {
    diaperType?: number;
    endTime?: string;
    page?: number;
    pageSize?: number;
    remark?: string;
    startTime?: string;
    stoolColor?: number;
    stoolTexture?: number;
    urineAmount?: number;
    urineColor?: number;
  }

  /** 分页返回结构，与后端 DiaperRecordPageResult 对齐 */
  export interface PageResult {
    list: DiaperRecord[];
    page: number;
    pageSize: number;
    total: number;
  }
}

/**
 * 获取换尿布记录列表（后端返回 {list,total,page,pageSize} 分页结构）
 * @param params 查询参数(QueryDiaperRecordDto)
 */
async function getDiaperRecordList(
  params: BabyDiaperRecordApi.PageQueryParams,
) {
  return requestClient.get<BabyDiaperRecordApi.PageResult>(
    '/babyRecord/diaperRecord/list',
    { params },
  );
}

/**
 * 新增换尿布记录
 * @param data 换尿布记录数据(对齐 CreateDiaperRecordDto)
 */
async function createDiaperRecord(data: BabyDiaperRecordApi.CreateModel) {
  return requestClient.post('/babyRecord/diaperRecord', data);
}

/**
 * 修改换尿布记录
 * @param id 记录ID
 * @param data 换尿布记录数据(对齐 UpdateDiaperRecordDto)
 */
async function updateDiaperRecord(
  id: string,
  data: BabyDiaperRecordApi.UpdateModel,
) {
  return requestClient.put(`/babyRecord/diaperRecord/${id}`, data);
}

/**
 * 删除换尿布记录（后端为逻辑删除）
 * @param id 记录ID
 */
async function deleteDiaperRecord(id: string) {
  return requestClient.delete(`/babyRecord/diaperRecord/${id}`);
}

export {
  createDiaperRecord,
  deleteDiaperRecord,
  getDiaperRecordList,
  updateDiaperRecord,
};

