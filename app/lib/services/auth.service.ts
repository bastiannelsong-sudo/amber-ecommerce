import { apiClient } from '../api-client';
import type { AuthResponse, ForgotPasswordResponse, User } from '../types';

/**
 * Cliente de auth desde el browser — apunta al BFF de Next (/api/auth/*).
 * Los tokens viven en cookie httpOnly seteada por el Route Handler,
 * no se exponen al JS del cliente.
 *
 * AuthResponse solo trae `customer` + flags auxiliares. Nada sensible.
 */
export const authService = {
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async googleAuth(idToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/google', {
      id_token: idToken,
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { email },
    );
    return response.data;
  },

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      { token, new_password: newPassword },
    );
    return response.data;
  },

  async logout(): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/auth/logout');
    return response.data;
  },

  async me(): Promise<User | null> {
    try {
      const response = await apiClient.get<User | null>('/auth/me');
      return response.data;
    } catch {
      return null;
    }
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  async updateProfile(data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  async linkGoogle(idToken: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/auth/link-google', {
      id_token: idToken,
    });
    return response.data;
  },

  async createPassword(password: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/auth/create-password', {
      password,
    });
    return response.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Compatibilidad con callers que aún usen el tipo AuthResponse — el nuevo
// contrato solo devuelve user; tokens viven en cookie httpOnly.
export type { AuthResponse };
