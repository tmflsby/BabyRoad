export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}
