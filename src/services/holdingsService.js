/**
 * Customer Holdings Service (Standalone Frontend)
 * Manages Gold and Silver holdings offline via AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const HOLDINGS_STORAGE_KEY = '@sj_standalone_holdings';

const DEFAULT_HOLDINGS = {
  gold: {
    metal: 'gold',
    quantity_grams: 0.2500,
    reserved_grams: 0,
    available_grams: 0.2500,
    total_invested: 3547.50,
  },
  silver: {
    metal: 'silver',
    quantity_grams: 15.00,
    reserved_grams: 0,
    available_grams: 15.00,
    total_invested: 4005.00,
  },
  total_invested: 7552.50,
};

export const holdingsService = {
  /**
   * Fetch authenticated customer's combined Gold and Silver holdings valuation
   */
  getHoldings: async () => {
    try {
      const stored = await AsyncStorage.getItem(HOLDINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default holdings
      await AsyncStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(DEFAULT_HOLDINGS));
      return DEFAULT_HOLDINGS;
    } catch (e) {
      console.warn('[holdingsService] Error getting holdings:', e);
      return DEFAULT_HOLDINGS;
    }
  },

  /**
   * Fetch holding for specific metal ('gold' | 'silver')
   */
  getMetalHolding: async (metal) => {
    const all = await holdingsService.getHoldings();
    const cleanMetal = (metal || 'gold').toLowerCase();
    return all[cleanMetal] || { quantity_grams: 0, available_grams: 0, reserved_grams: 0, total_invested: 0 };
  },

  /**
   * Add purchased grams to holdings
   */
  addPurchase: async (metal, grams, amount) => {
    try {
      const current = await holdingsService.getHoldings();
      const cleanMetal = (metal || 'gold').toLowerCase();
      const target = current[cleanMetal] || { quantity_grams: 0, available_grams: 0, reserved_grams: 0, total_invested: 0 };

      const newQty = (Number(target.quantity_grams) || 0) + Number(grams);
      const newAvail = (Number(target.available_grams) || 0) + Number(grams);
      const newInvested = (Number(target.total_invested) || 0) + Number(amount);

      const updated = {
        ...current,
        [cleanMetal]: {
          ...target,
          quantity_grams: newQty,
          available_grams: newAvail,
          total_invested: newInvested,
        },
        total_invested: (Number(current.total_invested) || 0) + Number(amount),
      };

      await AsyncStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[holdingsService] Error adding purchase to holdings:', e);
      return null;
    }
  },

  /**
   * Deduct grams upon withdrawal
   */
  deductWithdrawal: async (metal, grams) => {
    try {
      const current = await holdingsService.getHoldings();
      const cleanMetal = (metal || 'gold').toLowerCase();
      const target = current[cleanMetal] || { quantity_grams: 0, available_grams: 0, reserved_grams: 0, total_invested: 0 };

      const newQty = Math.max(0, (Number(target.quantity_grams) || 0) - Number(grams));
      const newAvail = Math.max(0, (Number(target.available_grams) || 0) - Number(grams));

      const updated = {
        ...current,
        [cleanMetal]: {
          ...target,
          quantity_grams: newQty,
          available_grams: newAvail,
        },
      };

      await AsyncStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('[holdingsService] Error deducting withdrawal from holdings:', e);
      return null;
    }
  },
};

export default holdingsService;
