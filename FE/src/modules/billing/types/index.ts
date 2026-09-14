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

export interface BankAccountItem {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder: string;
  branch: string;
  qr_template: string;
  is_primary: boolean;
  is_active: boolean;
  qr_url?: string;
  transfer_memo?: string;
}

export interface SepayTransactionItem {
  id: string;
  gateway: string;
  transaction_date: string;
  account_number: string;
  sub_account?: string;
  amount_in: number;
  amount_out: number;
  accumulated: number;
  code?: string;
  transaction_content: string;
  reference_number: string;
  status: string;
  provider_cost?: number;
  gross_profit?: number;
  images_count?: number;
}

export interface CreditConfigItem {
  min_deposit_amount: number;
  max_deposit_amount: number;
  credit_exchange_rate: number;
  low_balance_warning_threshold: number;
  bonus_tier_1_threshold: number;
  bonus_tier_1_pct: number;
  bonus_tier_2_threshold: number;
  bonus_tier_2_pct: number;
  auto_reconcile_sepay: boolean;
  allow_negative_balance: boolean;
}
