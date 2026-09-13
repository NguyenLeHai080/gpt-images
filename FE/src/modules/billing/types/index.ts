export interface WalletData {
  balance_amount: string;
  total_deposited: string;
  api_spent: string;
}

export interface TransactionItem {
  id: string;
  gateway: string;
  amount: string;
  status: 'success' | 'pending' | 'failed';
  description: string;
  created_at: string;
}
