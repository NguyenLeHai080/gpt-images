import { apiClient } from '../../../core/api/client';
import type { ApiResponse } from '../../../core/types';
import type { WalletData, TransactionItem } from '../types';

export const billingApi = {
  getWallet: async (): Promise<ApiResponse<WalletData>> => {
    try {
      return await apiClient.get<WalletData>('/billing/wallet');
    } catch {
      return {
        success: true,
        message: 'Mock Wallet Data',
        data: {
          balance_amount: '24.702 đ',
          total_deposited: '4.331.500 đ',
          api_spent: '480 đ',
        },
      };
    }
  },

  getTransactions: async (): Promise<ApiResponse<TransactionItem[]>> => {
    try {
      return await apiClient.get<TransactionItem[]>('/billing/transactions');
    } catch {
      return {
        success: true,
        message: 'Mock Transactions',
        data: [
          {
            id: 'tx_sep_9918',
            gateway: 'SePay',
            amount: '+ 500.000 đ',
            status: 'success',
            description: 'Nạp tiền ví API qua cổng SePay tự động',
            created_at: '10:30:15 10/9/2026',
          },
          {
            id: 'tx_qr_8812',
            gateway: 'Bank QR',
            amount: '+ 2.000.000 đ',
            status: 'success',
            description: 'Chuyển khoản Vietcombank QR Code',
            created_at: '15:45:00 01/9/2026',
          },
        ],
      };
    }
  },
};
