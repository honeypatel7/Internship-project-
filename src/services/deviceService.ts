import { apiClient } from './config';
import type { DeviceGroup, DeviceStatusCount, ApiResponse } from './types';

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds
let deviceCache: {
  data: DeviceGroup[] | null;
  timestamp: number | null;
} = {
  data: null,
  timestamp: null
};

export const deviceService = {
  async getDevices(apiHash: string): Promise<ApiResponse<DeviceGroup[]>> {
    // Check cache validity
    const now = Date.now();
    if (
      deviceCache.data &&
      deviceCache.timestamp &&
      now - deviceCache.timestamp < CACHE_DURATION
    ) {
      return {
        data: deviceCache.data,
        status: 200,
        message: 'Data retrieved from cache'
      };
    }

    try {
      const response = await apiClient.get('/get_devices', {
        params: {
          lang: 'en',
          user_api_hash: apiHash
        }
      });

      // Update cache
      deviceCache = {
        data: response.data,
        timestamp: now
      };

      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw error;
    }
  },

  async getDeviceStatusCount(apiHash: string): Promise<ApiResponse<DeviceStatusCount>> {
    try {
      const response = await this.getDevices(apiHash);
      // Ensure we count all devices, even if they're in groups without items array
      const allDevices = response.data.reduce((acc, group) => {
        if (Array.isArray(group.items)) {
          acc.push(...group.items);
        } else if (group.items) {
          // Handle case where items might be an object
          acc.push(group.items);
        }
        return acc;
      }, [] as Device[]);
      
      const statusCounts = allDevices.reduce(
        (acc: { running: number; stop: number; offline: number }, device) => {
          if (!device) {
            return acc;
          }
          if (device?.online === 'online') {
            acc.running += 1;
          } else if (device?.online === 'ack') {
            acc.stop += 1;
          } else {
            acc.offline += 1;
          }
          return acc;
        },
        { running: 0, stop: 0, offline: 0 }
      );

      const total = statusCounts.running + statusCounts.stop + statusCounts.offline;

      return {
        data: {
          running: statusCounts.running,
          stop: statusCounts.stop,
          offline: statusCounts.offline,
          total
        },
        status: 200
      };
    } catch (error) {
      throw error;
    }
  }
};