import { apiClient } from '../api-client';
import type { CustomerAddress, ChileGeoResponse } from '../types';

export interface CreateAddressInput {
  street: string;
  apartment?: string;
  city: string;
  region: string;
  zip_code?: string;
  is_default?: boolean;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;

/**
 * Cliente del address book desde el browser.
 * Apunta al BFF /api/addresses/* que proxy al backend autenticado via cookie.
 */
export const addressesService = {
  async list(): Promise<CustomerAddress[]> {
    const response = await apiClient.get<CustomerAddress[]>('/addresses');
    return response.data;
  },

  async create(input: CreateAddressInput): Promise<CustomerAddress> {
    const response = await apiClient.post<CustomerAddress>('/addresses', input);
    return response.data;
  },

  async update(
    id: number,
    input: UpdateAddressInput,
  ): Promise<CustomerAddress> {
    const response = await apiClient.patch<CustomerAddress>(
      `/addresses/${id}`,
      input,
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/addresses/${id}`);
  },

  async setDefault(id: number): Promise<CustomerAddress> {
    const response = await apiClient.post<CustomerAddress>(
      `/addresses/${id}/default`,
      {},
    );
    return response.data;
  },

  async getGeo(): Promise<ChileGeoResponse> {
    const response = await apiClient.get<ChileGeoResponse>('/geo');
    return response.data;
  },
};
