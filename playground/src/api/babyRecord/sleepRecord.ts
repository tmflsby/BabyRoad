import { requestClient } from '#/api/request';

export namespace BabySleepRecordApi {
  /** 睡眠记录，字段与后端 sleep_record 表(SleepRecord 实体)对齐 */
  export interface SleepRecord {
    /** 主键ID(bigint，接口返回为字符串) */
    id: string;
    /** 入睡时间 */
    startTime: string;
    /** 醒来时间(未醒则为 null) */
    endTime: null | string;
    /** 时长(分钟)，由后端按醒来时间计算 */
    duration: null | number;
    /** 质量: 1-好, 2-一般, 3-差 */
    quality: null | number;
    /** 类型: 1-小睡, 2-夜睡 */
    sleepType: number;
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

  /** 新增提交的数据，对齐 CreateSleepRecordDto(duration 不开放入参，由后端计算) */
  export interface CreateModel {
    /** 醒来时间，未醒时不下发 */
    endTime?: null | string;
    quality?: null | number;
    remark?: string;
    sleepType?: number;
    /** 入睡时间(ISO 8601) */
    startTime: string;
  }

  /** 修改提交的数据，对齐 UpdateSleepRecordDto(字段均可选，按需下发) */
  export interface UpdateModel {
    endTime?: null | string;
    quality?: null | number;
    remark?: string;
    sleepType?: number;
    startTime?: string;
  }

  /** 列表查询参数，对齐 QuerySleepRecordDto */
  export interface PageQueryParams {
    endTime?: string;
    page?: number;
    pageSize?: number;
    quality?: number;
    remark?: string;
    sleepType?: number;
    startTime?: string;
  }

  /** 分页返回结构，与后端 SleepRecordPageResult 对齐 */
  export interface PageResult {
    list: SleepRecord[];
    page: number;
    pageSize: number;
    total: number;
  }
}

/**
 * 获取睡眠记录列表（后端返回 {list,total,page,pageSize} 分页结构）
 * @param params 查询参数(QuerySleepRecordDto)
 */
async function getSleepRecordList(params: BabySleepRecordApi.PageQueryParams) {
  return requestClient.get<BabySleepRecordApi.PageResult>(
    '/babyRecord/sleepRecord/list',
    { params },
  );
}

/**
 * 新增睡眠记录
 * @param data 睡眠记录数据(对齐 CreateSleepRecordDto)
 */
async function createSleepRecord(data: BabySleepRecordApi.CreateModel) {
  return requestClient.post('/babyRecord/sleepRecord', data);
}

/**
 * 修改睡眠记录
 * @param id 记录ID
 * @param data 睡眠记录数据(对齐 UpdateSleepRecordDto)
 */
async function updateSleepRecord(
  id: string,
  data: BabySleepRecordApi.UpdateModel,
) {
  return requestClient.put(`/babyRecord/sleepRecord/${id}`, data);
}

/**
 * 删除睡眠记录（后端为逻辑删除）
 * @param id 记录ID
 */
async function deleteSleepRecord(id: string) {
  return requestClient.delete(`/babyRecord/sleepRecord/${id}`);
}

export {
  createSleepRecord,
  deleteSleepRecord,
  getSleepRecordList,
  updateSleepRecord,
};

