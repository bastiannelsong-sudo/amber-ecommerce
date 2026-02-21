import { apiClient } from '../api-client';

export const contactService = {
  async sendMessage(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/contact', data);
    return response.data;
  },
};
