export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

export type ApiRequest = {
  id: string;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string | object;
  timeout?: number;
};

export type ApiResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
};

export type TestResult = {
  id: string;
  request: ApiRequest;
  response?: ApiResponse;
  error?: string;
  createdAt: string;
  success: boolean;
};
