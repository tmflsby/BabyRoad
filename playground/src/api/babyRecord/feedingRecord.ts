import { requestClient } from '#/api/request';

export namespace BabyFeedingRecordApi {
  /** 喂奶记录，字段与后端 feeding_record 表(FeedingRecord 实体)对齐 */
  export interface FeedingRecord {
    /** 主键ID(bigint，接口返回为字符串) */
    id: string;
    /** 喂奶时间 */
    feedTime: string;
    /** 类型: 1-母乳, 2-配方奶, 3-混合 */
    feedType: number;
    /** 母乳侧: 1-左, 2-右, 3-双侧 */
    side: null | number;
    /** 喂奶时长(分钟) */
    duration: null | number;
    /** 奶量ml(后端 DECIMAL(6,1) 已转 number) */
    amount: null | number;
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

  /** 新增提交的数据，对齐 CreateFeedingRecordDto */
  export interface CreateModel {
    amount?: null | number;
    duration?: null | number;
    /** 喂奶时间(ISO 8601) */
    feedTime: string;
    feedType: number;
    remark?: string;
    side?: null | number;
  }

  /** 修改提交的数据，对齐 UpdateFeedingRecordDto(字段均可选，按需下发) */
  export interface UpdateModel {
    amount?: null | number;
    duration?: null | number;
    feedTime?: string;
    feedType?: number;
    remark?: string;
    side?: null | number;
  }

  /** 列表查询参数，对齐 QueryFeedingRecordDto */
  export interface PageQueryParams {
    endTime?: string;
    feedType?: number;
    page?: number;
    pageSize?: number;
    remark?: string;
    side?: number;
    startTime?: string;
  }

  /** 分页返回结构，与后端 FeedingRecordPageResult 对齐 */
  export interface PageResult {
    list: FeedingRecord[];
    page: number;
    pageSize: number;
    total: number;
  }
}

/**
 * 获取喂奶记录列表（后端返回 {list,total,page,pageSize} 分页结构）
 * @param params 查询参数(QueryFeedingRecordDto)
 */
async function getFeedingRecordList(
  params: BabyFeedingRecordApi.PageQueryParams,
) {
  return requestClient.get<BabyFeedingRecordApi.PageResult>(
    '/babyRecord/feedingRecord/list',
    { params },
  );
}

/**
 * 新增喂奶记录
 * @param data 喂奶记录数据(对齐 CreateFeedingRecordDto)
 */
async function createFeedingRecord(data: BabyFeedingRecordApi.CreateModel) {
  return requestClient.post('/babyRecord/feedingRecord', data);
}

/**
 * 修改喂奶记录
 * @param id 记录ID
 * @param data 喂奶记录数据(对齐 UpdateFeedingRecordDto)
 */
async function updateFeedingRecord(
  id: string,
  data: BabyFeedingRecordApi.UpdateModel,
) {
  return requestClient.put(`/babyRecord/feedingRecord/${id}`, data);
}

/**
 * 删除喂奶记录（后端为逻辑删除）
 * @param id 记录ID
 */
async function deleteFeedingRecord(id: string) {
  return requestClient.delete(`/babyRecord/feedingRecord/${id}`);
}

export {
  createFeedingRecord,
  deleteFeedingRecord,
  getFeedingRecordList,
  updateFeedingRecord,
};

