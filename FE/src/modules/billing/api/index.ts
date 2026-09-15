import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type {
  WalletData,
  TransactionItem,
  BankAccountItem,
  SepayTransactionItem,
  CreditConfigItem,
  ProviderBudgetOverview,
  TopupProviderBudgetPayload,
} from '../types';

export const billingApi = {
  getWallet: async (): Promise<ApiResponse<WalletData>> => {
    return apiClient.get<WalletData>('/billing/wallet');
  },

  getTransactions: async (): Promise<ApiResponse<TransactionItem[]>> => {
    return apiClient.get<TransactionItem[]>('/billing/transactions');
  },

  getBankAccounts: async (): Promise<ApiResponse<BankAccountItem[]>> => {
    return apiClient.get<BankAccountItem[]>('/billing/banking');
  },

  getSepayTransactions: async (): Promise<ApiResponse<SepayTransactionItem[]>> => {
    return apiClient.get<SepayTransactionItem[]>('/billing/sepay');
  },

  clearSepayTransactions: async (): Promise<ApiResponse<{ deleted_count: number }>> => {
    return apiClient.delete<{ deleted_count: number }>('/billing/sepay', { successToast: 'Đã làm sạch lịch sử nạp tiền SePay!' });
  },

  getCreditConfig: async (): Promise<ApiResponse<CreditConfigItem>> => {
    return apiClient.get<CreditConfigItem>('/billing/credit-config');
  },

  getProviderBudget: async (): Promise<ApiResponse<ProviderBudgetOverview>> => {
    return apiClient.get<ProviderBudgetOverview>('/billing/provider-budget');
  },

  topupProviderBudget: async (payload: TopupProviderBudgetPayload): Promise<ApiResponse<ProviderBudgetOverview>> => {
    return apiClient.post<ProviderBudgetOverview>('/billing/provider-budget/top-up', payload, {
      successToast: `Đã ghi nhận nạp thành công ${payload.amount.toLocaleString()} đ vào ngân sách NCC!`,
    });
  },

  syncProviderBudget: async (): Promise<ApiResponse<ProviderBudgetOverview>> => {
    return apiClient.post<ProviderBudgetOverview>('/billing/provider-budget/sync', {}, {
      successToast: 'Đã đồng bộ ngân sách QuotaGuard thời gian thực!',
    });
  },

  clearProviderBudgetLogs: async (): Promise<ApiResponse<ProviderBudgetOverview>> => {
    return apiClient.delete<ProviderBudgetOverview>('/billing/provider-budget/logs', {
      successToast: 'Đã xóa toàn bộ nhật ký nạp và đặt lại ngân sách về 100.000 đ!',
    });
  },

  deleteProviderBudgetLog: async (logId: string): Promise<ApiResponse<ProviderBudgetOverview>> => {
    return apiClient.delete<ProviderBudgetOverview>(`/billing/provider-budget/logs/${logId}`, {
      successToast: 'Đã xóa bản ghi lịch sử nạp!',
    });
  },
};

