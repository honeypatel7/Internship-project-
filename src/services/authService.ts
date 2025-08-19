import { apiClient } from './config';
import type { LoginCredentials, LoginResponse, ApiResponse } from './types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiClient.get('/login', {
        params: {
          email: credentials.email,
          password: credentials.password
        }
      });

      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw error;
    }
  }
};