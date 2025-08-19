import { apiClient } from './config';
import type { LocationAddress, ApiResponse } from './types';

export const geocodingService = {
  async getReverseGeocode(
    apiHash: string,
    latitude: number,
    longitude: number
  ): Promise<ApiResponse<LocationAddress>> {
    try {
      const response = await apiClient.get('/address/reverse', {
        params: {
          lang: 'en',
          user_api_hash: apiHash,
          lat: latitude,
          lon: longitude
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