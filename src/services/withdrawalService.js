/**
 * Withdrawal Service (Standalone Frontend)
 * Handles metal withdrawal requests, mock OTP challenges, and history offline via AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { holdingsService } from './holdingsService';
import { transactionService } from './transactionService';

const WITHDRAWALS_STORAGE_KEY = '@sj_standalone_withdrawals';
const PENDING_CHALLENGES = new Map();

export const withdrawalService = {
  /**
   * Request withdrawal OTP challenge
   * @param {Object} data - { metal: 'gold' | 'silver', quantity_grams: number, withdrawal_mode?: 'physical' | 'bank' }
   */
  requestWithdrawalOtp: async (data) => {
    const challengeId = `chal_${Date.now()}`;
    const cleanMetal = (data.metal || data.asset || 'gold').toLowerCase();
    const grams = Number(data.quantity_grams || data.grams || data.quantity || 0);
    const mode = data.withdrawal_mode || 'physical';

    PENDING_CHALLENGES.set(challengeId, {
      metal: cleanMetal,
      quantity_grams: grams,
      withdrawal_mode: mode,
      created_at: Date.now(),
    });

    return {
      success: true,
      challenge_id: challengeId,
      message: 'Withdrawal verification code dispatched. Demo OTP: 123456',
    };
  },

  /**
   * Resend withdrawal OTP
   * @param {string} challenge_id
   */
  resendWithdrawalOtp: async (challenge_id) => {
    return {
      success: true,
      challenge_id,
      message: 'Verification code resent. Demo OTP: 123456',
    };
  },

  /**
   * Verify withdrawal OTP and complete withdrawal creation
   * @param {string} challenge_id
   * @param {string} otp
   */
  verifyWithdrawalOtp: async (challenge_id, otp) => {
    const cleanOtp = (otp || '').toString().trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      throw new Error('Please enter a valid 6-digit withdrawal verification OTP.');
    }

    const challengeData = PENDING_CHALLENGES.get(challenge_id) || {
      metal: 'gold',
      quantity_grams: 0.1,
      withdrawal_mode: 'physical',
    };

    const { metal, quantity_grams, withdrawal_mode } = challengeData;
    PENDING_CHALLENGES.delete(challenge_id);

    const rate = metal === 'gold' ? 14190.00 : 267.00;
    const amountVal = Number((quantity_grams * rate).toFixed(2));

    const newWithdrawal = {
      id: `wth_${Date.now()}`,
      withdrawal_id: `WTH${Date.now()}`,
      metal,
      quantity_grams,
      withdrawal_mode,
      amount: amountVal,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const newTxn = {
      id: `txn_wth_${Date.now()}`,
      transaction_id: `TXN${Date.now()}`,
      type: 'withdrawal',
      direction: 'debit',
      metal,
      quantity_grams,
      rate_per_gram: rate,
      total_amount: amountVal,
      withdrawal_mode,
      payment_method: withdrawal_mode === 'bank' ? 'Bank Transfer' : 'Vault Withdrawal',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Deduct grams from holdings
    await holdingsService.deductWithdrawal(metal, quantity_grams);

    // Save to withdrawals list
    try {
      const stored = await AsyncStorage.getItem(WITHDRAWALS_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify([newWithdrawal, ...list]));
    } catch (e) {
      console.warn('[withdrawalService] Error saving withdrawal:', e);
    }

    // Record in unified transactions
    await transactionService.addTransaction(newTxn);

    return {
      success: true,
      withdrawal: newWithdrawal,
    };
  },

  /**
   * Submit direct withdrawal request (Legacy)
   */
  requestWithdrawal: async (data) => {
    const metal = (data.metal || data.asset || 'gold').toLowerCase();
    const grams = Number(data.quantity_grams || data.grams || data.quantity || 0);
    const mode = data.withdrawal_mode || 'physical';
    const rate = metal === 'gold' ? 14190.00 : 267.00;
    const amountVal = Number((grams * rate).toFixed(2));

    const newWithdrawal = {
      id: `wth_${Date.now()}`,
      withdrawal_id: `WTH${Date.now()}`,
      metal,
      quantity_grams: grams,
      withdrawal_mode: mode,
      amount: amountVal,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const newTxn = {
      id: `txn_wth_${Date.now()}`,
      transaction_id: `TXN${Date.now()}`,
      type: 'withdrawal',
      direction: 'debit',
      metal,
      quantity_grams: grams,
      rate_per_gram: rate,
      total_amount: amountVal,
      withdrawal_mode: mode,
      payment_method: mode === 'bank' ? 'Bank Transfer' : 'Vault Withdrawal',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await holdingsService.deductWithdrawal(metal, grams);

    try {
      const stored = await AsyncStorage.getItem(WITHDRAWALS_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify([newWithdrawal, ...list]));
    } catch (e) {
      console.warn('[withdrawalService] Error saving withdrawal:', e);
    }

    await transactionService.addTransaction(newTxn);
    return newWithdrawal;
  },

  /**
   * Fetch customer withdrawal requests
   */
  getWithdrawals: async (params = {}) => {
    try {
      const stored = await AsyncStorage.getItem(WITHDRAWALS_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      return { items: list, total: list.length };
    } catch (e) {
      console.warn('[withdrawalService] Error reading withdrawals:', e);
      return { items: [], total: 0 };
    }
  },

  /**
   * Fetch single withdrawal by ID
   */
  getWithdrawalById: async (id) => {
    const res = await withdrawalService.getWithdrawals();
    const list = res.items || [];
    return list.find((w) => w.id === id || w.withdrawal_id === id) || null;
  },

  /**
   * Cancel pending withdrawal request
   */
  cancelWithdrawal: async (id) => {
    try {
      const res = await withdrawalService.getWithdrawals();
      const list = res.items || [];
      const updated = list.map((w) => (w.id === id ? { ...w, status: 'cancelled' } : w));
      await AsyncStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(updated));
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },
};

export default withdrawalService;
