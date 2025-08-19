// Common Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user_api_hash: string;
}

export interface UserData {
  first_name: string | null;
  last_name: string | null;
}

export interface UserResponse {
  data: UserData;
}

// Geocoding Types
export interface LocationAddress {
  location: {
    address: string;
  };
}

// Device Types
export interface Device {
  id: string;
  name: string;
  time: string;
  speed: number;
  stop_duration: string;
  sensors: Array<{
    type: string;
    name: string;
    value: string;
  }>;
  online: 'online' | 'offline' | 'ack';
  [key: string]: unknown;
}

export interface DeviceGroup {
  items: Device[];
  [key: string]: unknown;
}

export interface DeviceStatusCount {
  running: number;
  stop: number;
  offline: number;
  total: number;
}