export interface ApiSuccessResponse<T> {
  success: true;
  code: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  code: number;
  message: string;
  errors: string[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
