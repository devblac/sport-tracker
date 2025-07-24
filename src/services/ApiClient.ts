import { authService } from './AuthService';
import { logger } from '@/utils';

interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: any;
}

class ApiClient {
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor(baseURL: string = '/api', timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  /**
   * Make an API request
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const { method, url, data, headers = {}, requiresAuth = true } = config;
    
    try {
      // Add authentication header if required
      if (requiresAuth) {
        const token = authService.getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else if (authService.isAuthenticated()) {
          // Try to refresh token if user is authenticated but token is missing/expired
          try {
            const newToken = await authService.refreshToken();
            headers['Authorization'] = `Bearer ${newToken}`;
          } catch (refreshError) {
            logger.warn('Token refresh failed, proceeding without auth', refreshError);
          }
        }
      }

      // Add default headers
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      headers['Accept'] = headers['Accept'] || 'application/json';

      // Build full URL
      const fullUrl = `${this.baseURL}${url}`;

      // Create request options
      const requestOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(this.timeout),
      };

      // Add body for non-GET requests
      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data);
      }

      logger.debug('Making API request', { method, url: fullUrl, requiresAuth });

      // Make the request
      const response = await fetch(fullUrl, requestOptions);

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Handle HTTP errors
      if (!response.ok) {
        const error: ApiError = {
          message: responseData?.message || response.statusText || 'Request failed',
          status: response.status,
          code: responseData?.code,
          data: responseData,
        };

        // Handle specific error cases
        if (response.status === 401) {
          logger.warn('Unauthorized request, clearing auth data');
          authService.logout();
        }

        logger.error('API request failed', error);
        throw error;
      }

      const apiResponse: ApiResponse<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      };

      logger.debug('API request successful', { method, url: fullUrl, status: response.status });
      return apiResponse;

    } catch (error) {
      // Handle network errors, timeouts, etc.
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('API request timeout', { method, url });
          throw new Error('Request timeout');
        }
        
        if (error.message.includes('Failed to fetch')) {
          logger.error('Network error', { method, url });
          throw new Error('Network error - please check your connection');
        }
      }

      logger.error('API request error', error);
      throw error;
    }
  }

  /**
   * Convenience methods
   */
  async get<T = any>(url: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, requiresAuth });
  }

  async post<T = any>(url: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, requiresAuth });
  }

  async put<T = any>(url: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, requiresAuth });
  }

  async patch<T = any>(url: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, requiresAuth });
  }

  async delete<T = any>(url: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, requiresAuth });
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiRequestConfig, ApiResponse, ApiError };