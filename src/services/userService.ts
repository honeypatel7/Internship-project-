import { apiClient } from './config';
import type { UserResponse, ApiResponse } from './types';

export const userService = {
  async getUserData(apiHash: string): Promise<ApiResponse<UserResponse>> {
    try {
      const response = await apiClient.get('/user_client', {
        params: {
          lang: 'en',
          user_api_hash: apiHash
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