import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type {
  WalletData,
  TransactionItem,
  BankAccountItem,
  SepayTransactionItem,
  CreditConfigItem,
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
};
