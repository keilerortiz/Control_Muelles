export interface ApiEnvelope<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
