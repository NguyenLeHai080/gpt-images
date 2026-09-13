import { useState, useEffect } from 'react';
import { billingApi } from '../api';
import type { WalletData, TransactionItem } from '../types';

export const useBilling = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([billingApi.getWallet(), billingApi.getTransactions()]).then(
      ([walletRes, txRes]) => {
        if (walletRes.data) setWallet(walletRes.data);
        if (txRes.data) setTransactions(txRes.data);
        setIsLoading(false);
      }
    );
  }, []);

  return { wallet, transactions, isLoading };
};
