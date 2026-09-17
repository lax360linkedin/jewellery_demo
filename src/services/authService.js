/**
 * Authentication Service (Standalone Frontend)
 * Manages user authentication, registration, mock OTP, and session management offline via AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUser, setStoredUser, setAuthToken, clearAllAuth } from '../utils/authStorage';

const REGISTERED_USERS_KEY = '@sj_standalone_registered_users';

export const authService = {
  /**
   * Dispatch OTP to mobile number (Standalone Mock)
   */
  sendOtp: async (mobile) => {
    return {
      success: true,
      message: 'OTP sent successfully! Demo OTP: 123456',
      mobile,
    };
  },

  /**
   * Verify entered OTP for mobile number (Standalone Mock)
   */
  verifyOtp: async (mobile, otp) => {
    const cleanOtp = (otp || '').toString().trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      throw new Error('Please enter a valid verification OTP.');
    }
    return {
      success: true,
      verified: true,
      message: 'OTP verified successfully.',
    };
  },

  /**
   * Register new user account locally
   */
  register: async ({ name, mobile, email, password }) => {
    const token = `mock_jwt_${Date.now()}`;
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name || 'Customer',
      mobile: mobile || '',
      email: email || '',
      role: 'customer',
      account_status: 'active',
      kyc_status: 'pending',
      profile_completed: false,
      created_at: new Date().toISOString(),
    };

    try {
      const existingStr = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const existingList = existingStr ? JSON.parse(existingStr) : [];
      const updatedList = [...existingList.filter((u) => u.mobile !== mobile), newUser];
      await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('[authService] Could not save to registered users list:', e);
    }

    await setAuthToken(token);
    await setStoredUser(newUser);

    return {
      access_token: token,
      user: newUser,
    };
  },

  /**
   * Authenticate user with mobile and password locally
   */
  login: async ({ mobile, password }) => {
    const token = `mock_jwt_${Date.now()}`;
    let matchedUser = null;

    try {
      const existingStr = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      const existingList = existingStr ? JSON.parse(existingStr) : [];
      matchedUser = existingList.find((u) => u.mobile === mobile);
    } catch (e) {
      console.warn('[authService] Error reading registered users:', e);
    }

    // If already registered, log them in with their saved state
    if (matchedUser) {
      await setAuthToken(token);
      await setStoredUser(matchedUser);
      return {
        access_token: token,
        user: matchedUser,
      };
    }

    // Default standalone demo user
    const demoUser = {
      id: `usr_${mobile || 'demo'}`,
      name: 'SJ Customer',
      mobile: mobile || '9876543210',
      email: 'customer@sjjewelers.com',
      role: 'customer',
      account_status: 'active',
      kyc_status: 'verified',
      profile_completed: true,
      created_at: new Date().toISOString(),
    };

    await setAuthToken(token);
    await setStoredUser(demoUser);

    return {
      access_token: token,
      user: demoUser,
    };
  },

  /**
   * Fetch current authenticated user record
   */
  getMe: async () => {
    const stored = await getStoredUser();
    if (stored) return stored;
    return null;
  },

  /**
   * Request password reset OTP
   */
  forgotPassword: async (mobile) => {
    return {
      success: true,
      message: 'Password reset OTP dispatched. Demo OTP: 123456',
    };
  },

  /**
   * Verify password reset OTP
   */
  resetPassword: async (data) => {
    return {
      success: true,
      message: 'Password reset successfully.',
    };
  },

  /**
   * Logout session
   */
  logout: async () => {
    await clearAllAuth();
    return { success: true };
  },
};

export default authService;
