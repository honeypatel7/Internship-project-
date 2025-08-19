import axios from "axios";
import type { ApiError } from "./types";

// Base configuration for API requests
export const API_BASE_URL = "https://track.onepointgps.com/api";

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    // You can add global request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || "An unexpected error occurred",
      status: error.response?.status || 500,
      details: error.response?.data,
    };
    return Promise.reject(apiError);
  }
);
