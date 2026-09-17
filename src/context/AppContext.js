/**
 * AppContext for React Native (Standalone Frontend)
 * Purely frontend state management with local persistence via AsyncStorage.
 * Zero backend server connection or network dependencies required.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuthToken,
  setAuthToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  clearAllAuth,
  getSkippedProfile,
  setSkippedProfile,
} from '../utils/authStorage';
import {
  authService,
  ratesService,
  holdingsService,
  purchaseService,
  withdrawalService,
  profileService,
  kycService,
  transactionService,
} from '../services';

const AppContext = createContext();

const LOGGED_OUT_USER = {
  id: '',
  name: '',
  mobile: '',
  email: '',
  role: 'customer',
  accountStatus: 'active',
  kycStatus: 'pending',
  profileCompleted: false,
  isAuthenticated: false,
  address: '',
  pan: '',
  aadhar: '',
  accountNumber: '',
  ifsc: '',
  nomineeName: '',
  nomineeMobile: '',
  nomineeDob: '',
  nomineeAddress: '',
  relationship: '',
  relationshipDetails: '',
  createdAt: '',
};

const INITIAL_HOLDINGS = {
  goldGrams: 0.2500,
  goldReservedGrams: 0,
  goldAvailableGrams: 0.2500,
  silverGrams: 15.00,
  silverReservedGrams: 0,
  silverAvailableGrams: 15.00,
  goldInvested: 3547.50,
  silverInvested: 4005.00,
  goldCurrentValue: 3547.50,
  silverCurrentValue: 4005.00,
  totalInvested: 7552.50,
  totalCurrentValue: 7552.50,
  totalProfitLoss: 0,
};

function normalizeUser(userObj) {
  if (!userObj) return LOGGED_OUT_USER;
  const prof = userObj.profile || {};
  const addr = userObj.address || prof.address || '';
  const addressStr = typeof addr === 'object' && addr !== null
    ? [addr.address_line, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
    : (typeof addr === 'string' ? addr : '');

  return {
    id: userObj.id || userObj.user_id || 'usr_demo',
    name: userObj.name || prof.full_name || 'SJ Customer',
    mobile: userObj.mobile || '',
    email: userObj.email || '',
    role: userObj.role || 'customer',
    accountStatus: userObj.accountStatus || userObj.account_status || 'active',
    kycStatus: userObj.kycStatus || userObj.kyc_status || 'verified',
    profileCompleted: userObj.profileCompleted !== undefined
      ? Boolean(userObj.profileCompleted)
      : (userObj.profile_completed !== undefined ? Boolean(userObj.profile_completed) : true),
    isAuthenticated: true,
    address: addressStr,
    pan: userObj.pan || prof.pan || '',
    aadhar: userObj.aadhar || prof.aadhar || '',
    accountNumber: userObj.accountNumber || userObj.account_number || prof.account_number || '',
    ifsc: userObj.ifsc || prof.ifsc || '',
    nomineeName: userObj.nomineeName || userObj.nominee_name || prof.nominee_name || '',
    nomineeMobile: userObj.nomineeMobile || userObj.nominee_mobile || prof.nominee_mobile || '',
    nomineeDob: userObj.nomineeDob || userObj.nominee_dob || prof.nominee_dob || '',
    nomineeAddress: userObj.nomineeAddress || userObj.nominee_address || prof.nominee_address || '',
    relationship: userObj.relationship || prof.relationship || '',
    relationshipDetails: userObj.relationshipDetails || userObj.relationship_other || prof.relationship_other || '',
    createdAt: userObj.createdAt || userObj.created_at || new Date().toISOString(),
  };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(LOGGED_OUT_USER);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hasSkippedProfile, setHasSkippedProfile] = useState(false);

  const [goldRate, setGoldRate] = useState(14190.00);
  const [silverRate, setSilverRate] = useState(267.00);
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  // Buy Now screen draft state
  const [buyNowState, setBuyNowState] = useState({
    assetType: 'gold',
    mode: 'rupees',
    rupeesVal: '100',
    gramsVal: (100 / 14190.00).toFixed(4),
    selectedQuickOption: '100',
  });

  // Recompute holdings current value dynamically whenever rates change
  useEffect(() => {
    setHoldings((prev) => {
      const gGrams = Number(prev.goldGrams) || 0;
      const sGrams = Number(prev.silverGrams) || 0;
      const gVal = gGrams * goldRate;
      const sVal = sGrams * silverRate;
      const totVal = gVal + sVal;
      const totInv = Number(prev.totalInvested) || totVal;
      return {
        ...prev,
        goldCurrentValue: gVal,
        silverCurrentValue: sVal,
        totalCurrentValue: totVal,
        totalProfitLoss: totVal - totInv,
      };
    });
  }, [goldRate, silverRate]);

  // Fetch Live Rates (Offline Mock)
  const fetchLiveRates = useCallback(async () => {
    try {
      const data = await ratesService.getLiveRates();
      if (data) {
        if (data.gold?.active_rate) setGoldRate(Number(data.gold.active_rate));
        if (data.silver?.active_rate) setSilverRate(Number(data.silver.active_rate));
        return data;
      }
    } catch (err) {
      console.warn('[AppContext] Error fetching rates:', err.message);
    }
    return null;
  }, []);

  // Fetch Holdings from Local Storage
  const fetchHoldings = useCallback(async () => {
    try {
      const data = await holdingsService.getHoldings();
      if (data) {
        const goldTotal = Number(data.gold?.quantity_grams) || 0;
        const goldReserved = Number(data.gold?.reserved_grams) || 0;
        const goldAvailable = data.gold?.available_grams !== undefined
          ? Number(data.gold.available_grams)
          : Math.max(0, goldTotal - goldReserved);

        const silverTotal = Number(data.silver?.quantity_grams) || 0;
        const silverReserved = Number(data.silver?.reserved_grams) || 0;
        const silverAvailable = data.silver?.available_grams !== undefined
          ? Number(data.silver.available_grams)
          : Math.max(0, silverTotal - silverReserved);

        const gVal = goldTotal * goldRate;
        const sVal = silverTotal * silverRate;
        const totVal = gVal + sVal;
        const totInv = Number(data.total_invested) || totVal;

        const mapped = {
          goldGrams: goldTotal,
          goldReservedGrams: goldReserved,
          goldAvailableGrams: goldAvailable,
          silverGrams: silverTotal,
          silverReservedGrams: silverReserved,
          silverAvailableGrams: silverAvailable,
          goldInvested: Number(data.gold?.total_invested) || 0,
          silverInvested: Number(data.silver?.total_invested) || 0,
          goldCurrentValue: gVal,
          silverCurrentValue: sVal,
          totalInvested: totInv,
          totalCurrentValue: totVal,
          totalProfitLoss: totVal - totInv,
        };
        setHoldings(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[AppContext] Error fetching holdings:', err.message);
    }
    return null;
  }, [goldRate, silverRate]);

  // Fetch Unified Transactions from Local Storage
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await transactionService.getTransactions({ limit: 50 });
      const items = res?.items || (Array.isArray(res) ? res : []);
      const mapped = items.map((txn) => {
        const isGold = (txn.metal || '').toLowerCase() === 'gold';
        const isPurchase = (txn.type || '').toLowerCase() === 'purchase';
        const gramsNum = Number(txn.quantity_grams) || 0;
        const amountNum = Number(txn.total_amount) || Number(txn.metal_value) || 0;
        const rateNum = Number(txn.rate_per_gram) || 0;
        const d = new Date(txn.created_at || Date.now());
        const formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        let displayStatus = 'Pending';
        if (txn.status === 'completed' || txn.status === 'approved') {
          displayStatus = 'Success';
        } else if (txn.status === 'rejected' || txn.status === 'cancelled') {
          displayStatus = 'Rejected';
        }

        return {
          id: txn.transaction_id || txn.id,
          transactionId: txn.transaction_id || txn.id,
          customer: currentUser.name || 'Customer',
          userId: txn.user_id || currentUser.id,
          date: formattedDate,
          time: formattedTime,
          type: txn.type,
          direction: txn.direction,
          paymentMethod: isPurchase ? (txn.payment_method || 'UPI') : (txn.withdrawal_mode === 'bank' ? 'Bank Transfer' : 'Vault Withdrawal'),
          asset: isGold ? 'Gold' : 'Silver',
          assetType: isGold ? 'gold' : 'silver',
          quantity: `${gramsNum.toFixed(4)} gm`,
          grams: gramsNum,
          rate: rateNum,
          amount: amountNum.toFixed(2),
          status: displayStatus,
          rawStatus: txn.status,
          createdAt: txn.created_at,
        };
      });
      setTransactions(mapped);
      return mapped;
    } catch (err) {
      console.warn('[AppContext] Error fetching transactions:', err.message);
    }
    return [];
  }, [currentUser.name, currentUser.id]);

  // Fetch Withdrawals from Local Storage
  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await withdrawalService.getWithdrawals({ limit: 50 });
      const items = res?.items || (Array.isArray(res) ? res : []);
      setWithdrawals(items);
      return items;
    } catch (err) {
      console.warn('[AppContext] Error fetching withdrawals:', err.message);
    }
    return [];
  }, []);

  // Fetch Full Profile from Local Storage
  const fetchProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      if (data) {
        const normalized = normalizeUser(data);
        setCurrentUser(normalized);
        await setStoredUser(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('[AppContext] Error fetching profile:', err.message);
    }
    return null;
  }, []);

  // Lifecycle Session Restoration on Mount
  useEffect(() => {
    const initializeAppState = async () => {
      try {
        const token = await getAuthToken();
        const skipped = await getSkippedProfile();
        setHasSkippedProfile(skipped);

        if (token) {
          const storedUser = await getStoredUser();
          if (storedUser) {
            setCurrentUser(normalizeUser(storedUser));
          } else {
            setCurrentUser(LOGGED_OUT_USER);
          }
        } else {
          setCurrentUser(LOGGED_OUT_USER);
        }

        // Fetch rates, holdings, and transactions
        await fetchLiveRates();
        await fetchHoldings();
        await fetchTransactions();
        await fetchWithdrawals();
      } catch (err) {
        console.warn('[AppContext] Error initializing standalone app state:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAppState();
  }, [fetchLiveRates, fetchHoldings, fetchTransactions, fetchWithdrawals]);

  // Load customer data whenever authenticated
  useEffect(() => {
    if (currentUser.isAuthenticated) {
      fetchHoldings();
      fetchTransactions();
      fetchWithdrawals();
    }
  }, [currentUser.isAuthenticated, fetchHoldings, fetchTransactions, fetchWithdrawals]);

  // Login Handler (Standalone Offline)
  const loginUser = useCallback(async (mobile, password) => {
    const res = await authService.login({ mobile, password });
    if (res && res.user) {
      const normalized = normalizeUser(res.user);
      await setStoredUser(normalized);
      setCurrentUser(normalized);
      await fetchHoldings();
      await fetchTransactions();
      await fetchWithdrawals();
      return normalized;
    }
    return null;
  }, [fetchHoldings, fetchTransactions, fetchWithdrawals]);

  // Register Handler (Standalone Offline)
  const registerUser = useCallback(async (name, mobile, password, email = '') => {
    const payload = typeof name === 'object'
      ? name
      : { name, mobile, password, email };
    const res = await authService.register(payload);
    if (res && res.user) {
      const normalized = normalizeUser(res.user);
      await setStoredUser(normalized);
      setCurrentUser(normalized);
      await fetchHoldings();
      await fetchTransactions();
      await fetchWithdrawals();
      return normalized;
    }
    return null;
  }, [fetchHoldings, fetchTransactions, fetchWithdrawals]);

  // Reset Password Handler
  const resetUserPassword = useCallback(async (mobile, newPassword) => {
    return true;
  }, []);

  // Complete User Profile (Standalone Offline)
  const completeUserProfile = useCallback(async (formData) => {
    const payload = {
      name: formData.name || formData.full_name || currentUser.name,
      address: typeof formData.address === 'string'
        ? formData.address
        : [formData.address, formData.city, formData.state, formData.pincode].filter(Boolean).join(', '),
      pan: formData.pan || null,
      aadhar: formData.aadhar || null,
      accountNumber: formData.accountNumber || formData.account_number || null,
      ifsc: formData.ifsc || null,
      nomineeName: formData.nomineeName || formData.nominee_name || null,
      nomineeMobile: formData.nomineeMobile || formData.nominee_mobile || null,
      nomineeDob: formData.nomineeDob || formData.nominee_dob || null,
      nomineeAddress: formData.nomineeAddress || formData.nominee_address || null,
      relationship: formData.relationship || null,
      relationshipDetails: formData.relationshipDetails || formData.relationship_other || null,
      profileCompleted: true,
      profile_completed: true,
    };

    const updated = await profileService.updateProfile(payload);
    if (updated) {
      const normalized = normalizeUser(updated);
      await setStoredUser(normalized);
      setCurrentUser(normalized);
      return normalized;
    }
    return null;
  }, [currentUser.name]);

  // Skip Profile
  const skipProfile = useCallback(async () => {
    await setSkippedProfile(true);
    setHasSkippedProfile(true);
  }, []);

  // Logout Handler
  const logoutUser = useCallback(async () => {
    try {
      await authService.logout().catch(() => {});
    } catch {}
    await clearAllAuth();
    setCurrentUser(LOGGED_OUT_USER);
    setHasSkippedProfile(false);
    setHoldings(INITIAL_HOLDINGS);
    setTransactions([]);
    setWithdrawals([]);
    setBuyNowState({
      assetType: 'gold',
      mode: 'rupees',
      rupeesVal: '100',
      gramsVal: (100 / 14190.00).toFixed(4),
      selectedQuickOption: '100',
    });
  }, []);

  // Submit KYC Request (Standalone Offline)
  const submitKycRequest = useCallback(async ({ pan, aadhar }) => {
    const cleanPan = (pan || '').trim().toUpperCase();
    const cleanAadhar = (aadhar || '').replace(/\D/g, '');

    const kycRes = await kycService.submitKyc({
      pan: cleanPan,
      aadhar: cleanAadhar,
      id_type: 'pan',
      id_number: cleanPan,
    });

    await fetchProfile();
    return { success: true, data: kycRes };
  }, [fetchProfile]);

  // Create Purchase (Standalone Offline)
  const addPurchaseTransaction = useCallback(async (txnData) => {
    const res = await purchaseService.createPurchase(txnData);
    await fetchHoldings();
    await fetchTransactions();
    return res;
  }, [fetchHoldings, fetchTransactions]);

  // Request Withdrawal OTP (Step 1)
  const requestWithdrawalOtp = useCallback(async (wthData) => {
    return await withdrawalService.requestWithdrawalOtp(wthData);
  }, []);

  // Resend Withdrawal OTP
  const resendWithdrawalOtp = useCallback(async (challengeId) => {
    return await withdrawalService.resendWithdrawalOtp(challengeId);
  }, []);

  // Verify Withdrawal OTP & Finalize Withdrawal Creation (Step 2)
  const verifyWithdrawalOtp = useCallback(async (challengeId, otp) => {
    const res = await withdrawalService.verifyWithdrawalOtp(challengeId, otp);
    await Promise.allSettled([
      fetchHoldings(),
      fetchWithdrawals(),
      fetchTransactions(),
    ]);
    return res;
  }, [fetchHoldings, fetchWithdrawals, fetchTransactions]);

  // Request Withdrawal (Legacy/Direct)
  const requestWithdrawal = useCallback(async (wthData) => {
    const res = await withdrawalService.requestWithdrawal(wthData);
    await fetchHoldings();
    await fetchWithdrawals();
    await fetchTransactions();
    return res;
  }, [fetchHoldings, fetchWithdrawals, fetchTransactions]);

  const value = {
    currentUser,
    isAuthLoading,
    hasSkippedProfile,
    goldRate,
    silverRate,
    setGoldRate,
    setSilverRate,
    holdings,
    transactions,
    withdrawals,
    buyNowState,
    setBuyNowState,
    fetchLiveRates,
    fetchHoldings,
    fetchTransactions,
    fetchWithdrawals,
    fetchProfile,
    loginUser,
    registerUser,
    resetUserPassword,
    completeUserProfile,
    skipProfile,
    logoutUser,
    submitKycRequest,
    addPurchaseTransaction,
    requestWithdrawal,
    requestWithdrawalOtp,
    resendWithdrawalOtp,
    verifyWithdrawalOtp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;

