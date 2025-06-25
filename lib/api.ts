"use client";

import axios from 'axios';
import { getTokensInfo, setTokensInfo } from './auth-tokens';
import { AUTH_REFRESH_URL } from './config';

const api = axios.create({
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const tokens = getTokensInfo();
    
    if (tokens?.token) {
      // Check if token is about to expire (within 1 minute)
      if (tokens.tokenExpires && tokens.tokenExpires - 60000 <= Date.now()) {
        try {
          const response = await axios.post(AUTH_REFRESH_URL, {}, {
            headers: {
              Authorization: `Bearer ${tokens.refreshToken}`,
            },
          });
          
          const newTokens = {
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            tokenExpires: response.data.tokenExpires,
          };
          
          setTokensInfo(newTokens);
          config.headers.Authorization = `Bearer ${newTokens.token}`;
        } catch (error) {
          // Refresh failed, clear tokens
          setTokensInfo(null);
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }
      } else {
        config.headers.Authorization = `Bearer ${tokens.token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setTokensInfo(null);
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;