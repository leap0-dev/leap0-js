export interface RequestOptions {
  timeout?: number;
  headers?: HeadersInit;
  query?: Record<string, string | number | boolean | undefined>;
}
