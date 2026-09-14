import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type {
  ModelPricingItem,
  CreateModelPricingRequest,
  UpdateModelPricingRequest,
  PricingSimulatorRequest,
  PricingSimulatorResponse
} from '../types';

export const pricingApi = {
  getPricing: async (): Promise<ApiResponse<ModelPricingItem[]>> => {
    return apiClient.get<ModelPricingItem[]>('/pricing');
  },

  createModelPricing: async (
    payload: CreateModelPricingRequest
  ): Promise<ApiResponse<ModelPricingItem>> => {
    return apiClient.post<ModelPricingItem>('/pricing', payload);
  },

  updateModelPricing: async (
    model: string,
    payload: UpdateModelPricingRequest
  ): Promise<ApiResponse<ModelPricingItem>> => {
    return apiClient.put<ModelPricingItem>(`/pricing/${model}`, payload);
  },

  deleteModelPricing: async (
    model: string
  ): Promise<ApiResponse<{ model: string }>> => {
    return apiClient.delete<{ model: string }>(`/pricing/${model}`);
  },

  simulateCost: async (req: PricingSimulatorRequest): Promise<ApiResponse<PricingSimulatorResponse>> => {
    return apiClient.post<PricingSimulatorResponse>('/pricing/simulator', req);
  },
};
