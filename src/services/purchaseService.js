/**
 * Purchase Service (Standalone Frontend)
 * Handles Gold & Silver purchases offline via AsyncStorage.
 */

import { holdingsService } from './holdingsService';
import { transactionService } from './transactionService';

export const purchaseService = {
  /**
   * Submit purchase order for metal
   * @param {Object} data - { metal, quantity_grams, amount, ratePerGram, paymentMethod }
   */
  createPurchase: async (data) => {
    const metal = (data.metal || data.assetType || data.asset || 'gold').toLowerCase();
    const quantityGrams = Number(data.quantity_grams || data.grams || data.quantity || 0);
    const ratePerGram = Number(data.ratePerGram || data.rate || (metal === 'gold' ? 14190.00 : 267.00));
    const metalVal = quantityGrams * ratePerGram;
    const totalAmount = Number(data.amount) || Number((metalVal * 1.03).toFixed(2));
    const paymentMethod = data.paymentMethod || data.payment_method || 'UPI';

    const newTxn = {
      id: `txn_${Date.now()}`,
      transaction_id: `TXN${Date.now()}`,
      type: 'purchase',
      direction: 'credit',
      metal,
      quantity_grams: quantityGrams,
      rate_per_gram: ratePerGram,
      total_amount: totalAmount,
      metal_value: metalVal,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    // Credit user's holdings
    await holdingsService.addPurchase(metal, quantityGrams, totalAmount);

    // Save transaction to history
    await transactionService.addTransaction(newTxn);

    return newTxn;
  },

  /**
   * Fetch customer purchase history
   */
  getPurchases: async (params = {}) => {
    const res = await transactionService.getTransactions(params);
    const purchases = (res.items || []).filter((t) => (t.type || '').toLowerCase() === 'purchase');
    return { items: purchases, total: purchases.length };
  },

  /**
   * Fetch single purchase by ID
   */
  getPurchaseById: async (id) => {
    return transactionService.getTransactionById(id);
  },

  /**
   * Fetch transaction history alias
   */
  getTransactions: async (params = {}) => {
    return transactionService.getTransactions(params);
  },
};

export default purchaseService;
