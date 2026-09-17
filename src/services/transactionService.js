/**
 * Unified Transaction History Service (Standalone Frontend)
 * Manages customer transaction history offline via AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const TRANSACTIONS_STORAGE_KEY = '@sj_standalone_transactions';

const INITIAL_TRANSACTIONS = [
  {
    id: 'txn_init_1',
    transaction_id: 'TXN1000214',
    type: 'purchase',
    direction: 'credit',
    metal: 'gold',
    quantity_grams: 0.2500,
    rate_per_gram: 14190.00,
    total_amount: 3547.50,
    payment_method: 'UPI',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'txn_init_2',
    transaction_id: 'TXN1000189',
    type: 'purchase',
    direction: 'credit',
    metal: 'silver',
    quantity_grams: 15.00,
    rate_per_gram: 267.00,
    total_amount: 4005.00,
    payment_method: 'UPI',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const transactionService = {
  /**
   * Fetch unified transaction history
   */
  getTransactions: async (params = {}) => {
    try {
      const stored = await AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        return { items: list, total: list.length };
      }
      // Initialize with default transactions
      await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return { items: INITIAL_TRANSACTIONS, total: INITIAL_TRANSACTIONS.length };
    } catch (e) {
      console.warn('[transactionService] Error reading transactions:', e);
      return { items: INITIAL_TRANSACTIONS, total: INITIAL_TRANSACTIONS.length };
    }
  },

  /**
   * Fetch single transaction detail by ID
   */
  getTransactionById: async (id) => {
    const res = await transactionService.getTransactions();
    const list = res.items || [];
    return list.find((t) => t.id === id || t.transaction_id === id) || null;
  },

  /**
   * Append a new transaction record
   */
  addTransaction: async (txn) => {
    try {
      const res = await transactionService.getTransactions();
      const currentList = res.items || [];
      const updatedList = [txn, ...currentList];
      await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(updatedList));
      return txn;
    } catch (e) {
      console.warn('[transactionService] Error adding transaction:', e);
      return txn;
    }
  },
};

export default transactionService;
