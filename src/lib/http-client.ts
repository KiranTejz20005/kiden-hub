import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';
import type { ErrorCode } from './errors';

const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
  };
}

const httpClient = axios.create({
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const duration = Date.now() - (response.config.metadata?.startTime ?? Date.now());
    logger.debug(`API ${response.config.method?.toUpperCase()} ${response.config.url} completed in ${duration}ms`);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number; metadata?: { startTime: number } };
    if (!config) {return Promise.reject(error);}

    const duration = Date.now() - (config.metadata?.startTime ?? Date.now());
    config._retryCount = config._retryCount ?? 0;

    const shouldRetry =
      config._retryCount < MAX_RETRIES &&
      (!error.response || error.response.status >= 500 || error.response.status === 429);

    if (shouldRetry) {
      config._retryCount++;
      const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
      logger.warn(`Retrying ${config.method?.toUpperCase()} ${config.url} (attempt ${config._retryCount}/${MAX_RETRIES}) after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return httpClient.request(config);
    }

    logger.error(
      `API ${config.method?.toUpperCase()} ${config.url} failed after ${duration}ms (retries: ${config._retryCount})`,
      error instanceof Error ? error : undefined,
    );

    return Promise.reject(error);
  },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await httpClient.get<T>(url, config);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await httpClient.post<T>(url, data, config);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function apiPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await httpClient.put<T>(url, data, config);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await httpClient.delete<T>(url, config);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    return handleError(error);
  }
}

function handleError<T>(error: unknown): ApiResponse<T> {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    let code: ErrorCode;

    if (status === 401) {code = 'AUTHENTICATION_ERROR';}
    else if (status === 403) {code = 'AUTHORIZATION_ERROR';}
    else if (status === 404) {code = 'NOT_FOUND';}
    else if (status === 409) {code = 'CONFLICT_ERROR';}
    else if (status === 429) {code = 'RATE_LIMIT_ERROR';}
    else {code = 'INTERNAL_ERROR';}

    return {
      success: false,
      error: {
        code,
        message: (error.response.data as Record<string, unknown>)?.error as string ?? error.message,
      },
    };
  }

  if (error instanceof AxiosError && error.code === 'ECONNABORTED') {
    return {
      success: false,
      error: { code: 'TIMEOUT_ERROR', message: 'Request timed out' },
    };
  }

  return {
    success: false,
    error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
  };
}

declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: { startTime: number };
    _retryCount?: number;
  }
}

export { httpClient };
