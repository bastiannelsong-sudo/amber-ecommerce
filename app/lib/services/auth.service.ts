import { apiClient } from '../api-client';
import type { AuthResponse, ForgotPasswordResponse } from '../types';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post('/ecommerce-auth/register', data);
    return response.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post('/ecommerce-auth/login', data);
    return response.data;
  },

  async googleAuth(idToken: string): Promise<AuthResponse> {
    const response = await apiClient.post('/ecommerce-auth/google', {
      id_token: idToken,
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post('/ecommerce-auth/forgot-password', {
      email,
    });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/ecommerce-auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const response = await apiClient.post('/ecommerce-auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/ecommerce-auth/profile');
    return response.data;
  },

  async updateProfile(data: { first_name?: string; last_name?: string; phone?: string }) {
    const response = await apiClient.put('/ecommerce-auth/profile', data);
    return response.data;
  },

  async linkGoogle(idToken: string) {
    const response = await apiClient.post('/ecommerce-auth/link-google', {
      id_token: idToken,
    });
    return response.data;
  },

  async createPassword(password: string) {
    const response = await apiClient.post('/ecommerce-auth/create-password', {
      password,
    });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.post('/ecommerce-auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
